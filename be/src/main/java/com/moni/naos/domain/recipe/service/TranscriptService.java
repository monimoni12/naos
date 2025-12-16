package com.moni.naos.domain.recipe.service;

import com.moni.naos.domain.recipe.dto.ClipWithTextResponse;
import com.moni.naos.domain.recipe.dto.TranscriptResponse;
import com.moni.naos.domain.recipe.dto.TranscriptSegmentDto;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeClip;
import com.moni.naos.domain.recipe.entity.RecipeClipSegment;
import com.moni.naos.domain.recipe.entity.RecipeTranscriptMeta;
import com.moni.naos.domain.recipe.repository.RecipeClipRepository;
import com.moni.naos.domain.recipe.repository.RecipeClipSegmentRepository;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.recipe.repository.RecipeTranscriptMetaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * TranscriptService - 전사(Transcript) 비즈니스 로직
 *
 * 구조:
 * - RecipeTranscriptMeta: 전사 상태/메타데이터
 * - RecipeClipSegment: 실제 세그먼트 데이터 (기존 엔티티 활용)
 *
 * 주요 기능:
 * 1. Whisper 전사 결과 저장 (세그먼트 각각 저장)
 * 2. 클립 시간 구간 → 해당 텍스트 매핑
 * 3. 클립별 텍스트 조회
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TranscriptService {

    private final RecipeRepository recipeRepository;
    private final RecipeTranscriptMetaRepository metaRepository;
    private final RecipeClipSegmentRepository segmentRepository;
    private final RecipeClipRepository clipRepository;

    // ==================== 전사 결과 저장 ====================

    /**
     * Whisper 전사 결과 저장
     * Flask AI 서버에서 호출
     *
     * @param recipeId 레시피 ID
     * @param fullText 전체 전사 텍스트
     * @param segments 세그먼트 목록
     * @param language 감지된 언어
     * @param duration 영상 길이(초)
     */
    @Transactional
    public TranscriptResponse saveTranscript(
            Long recipeId,
            String fullText,
            List<TranscriptSegmentDto> segments,
            String language,
            Double duration
    ) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + recipeId));

        // 1. 기존 세그먼트 삭제
        segmentRepository.deleteByRecipe(recipe);

        // 2. 새 세그먼트 저장
        for (int i = 0; i < segments.size(); i++) {
            TranscriptSegmentDto seg = segments.get(i);

            RecipeClipSegment entity = RecipeClipSegment.builder()
                    .recipe(recipe)
                    .indexOrd(i)
                    .text(seg.getText())
                    .startSec(seg.getStart())
                    .endSec(seg.getEnd())
                    .build();

            segmentRepository.save(entity);
        }

        // 3. 메타데이터 저장/업데이트
        RecipeTranscriptMeta meta = metaRepository.findByRecipe(recipe)
                .orElse(RecipeTranscriptMeta.builder()
                        .recipe(recipe)
                        .build());

        meta.complete(fullText, segments.size(), duration, language);
        metaRepository.save(meta);

        log.info("전사 결과 저장: recipeId={}, segmentCount={}", recipeId, segments.size());

        // 4. 응답 생성
        List<TranscriptSegmentDto> savedSegments = segmentRepository.findByRecipeOrderByIndexOrdAsc(recipe)
                .stream()
                .map(TranscriptSegmentDto::fromEntity)
                .collect(Collectors.toList());

        return TranscriptResponse.fromMetaWithSegments(meta, savedSegments);
    }

    /**
     * 전사 시작 처리
     */
    @Transactional
    public void startProcessing(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + recipeId));

        RecipeTranscriptMeta meta = metaRepository.findByRecipe(recipe)
                .orElse(RecipeTranscriptMeta.builder().recipe(recipe).build());

        meta.startProcessing();
        metaRepository.save(meta);

        log.info("전사 처리 시작: recipeId={}", recipeId);
    }

    /**
     * 전사 실패 처리
     */
    @Transactional
    public void markFailed(Long recipeId, String errorMessage) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + recipeId));

        RecipeTranscriptMeta meta = metaRepository.findByRecipe(recipe)
                .orElse(RecipeTranscriptMeta.builder().recipe(recipe).build());

        meta.fail(errorMessage);
        metaRepository.save(meta);

        log.warn("전사 실패: recipeId={}, error={}", recipeId, errorMessage);
    }

    /**
     * 음성 없음 처리
     */
    @Transactional
    public void markNoAudio(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + recipeId));

        RecipeTranscriptMeta meta = metaRepository.findByRecipe(recipe)
                .orElse(RecipeTranscriptMeta.builder().recipe(recipe).build());

        meta.markNoAudio();
        metaRepository.save(meta);

        log.info("음성 없음 처리: recipeId={}", recipeId);
    }

    // ==================== 전사 결과 조회 ====================

    /**
     * 레시피의 전사 결과 조회 (메타 + 세그먼트)
     */
    public TranscriptResponse getTranscript(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId).orElse(null);
        if (recipe == null) {
            return TranscriptResponse.notFound(recipeId);
        }

        RecipeTranscriptMeta meta = metaRepository.findByRecipe(recipe).orElse(null);
        if (meta == null) {
            return TranscriptResponse.notFound(recipeId);
        }

        List<TranscriptSegmentDto> segments = segmentRepository.findByRecipeOrderByIndexOrdAsc(recipe)
                .stream()
                .map(TranscriptSegmentDto::fromEntity)
                .collect(Collectors.toList());

        return TranscriptResponse.fromMetaWithSegments(meta, segments);
    }

    /**
     * 전사 상태만 조회
     */
    public String getTranscriptStatus(Long recipeId) {
        return metaRepository.findByRecipeId(recipeId)
                .map(meta -> meta.getStatus().name())
                .orElse("NOT_FOUND");
    }

    /**
     * 전사 완료 여부
     */
    public boolean hasCompletedTranscript(Long recipeId) {
        return metaRepository.findByRecipeId(recipeId)
                .map(RecipeTranscriptMeta::isCompleted)
                .orElse(false);
    }

    // ==================== 시간 구간 → 텍스트 매핑 (핵심!) ====================

    /**
     * 특정 시간 구간의 텍스트 조회
     * 클립의 startSec~endSec에 해당하는 세그먼트 텍스트 반환
     */
    public String getTextForTimeRange(Long recipeId, Double startSec, Double endSec) {
        List<TranscriptSegmentDto> segments = getSegmentsForTimeRange(recipeId, startSec, endSec);

        return segments.stream()
                .map(TranscriptSegmentDto::getText)
                .collect(Collectors.joining(" "));
    }

    /**
     * 특정 시간 구간의 세그먼트 목록 조회
     */
    public List<TranscriptSegmentDto> getSegmentsForTimeRange(Long recipeId, Double startSec, Double endSec) {
        Recipe recipe = recipeRepository.findById(recipeId).orElse(null);
        if (recipe == null) {
            return new ArrayList<>();
        }

        List<RecipeClipSegment> allSegments = segmentRepository.findByRecipeOrderByIndexOrdAsc(recipe);

        // 시간 범위에 해당하는 세그먼트 필터링
        return allSegments.stream()
                .filter(seg -> isOverlapping(seg.getStartSec(), seg.getEndSec(), startSec, endSec))
                .map(TranscriptSegmentDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 두 구간이 겹치는지 확인
     */
    private boolean isOverlapping(Double segStart, Double segEnd, Double rangeStart, Double rangeEnd) {
        if (segStart == null || segEnd == null || rangeStart == null || rangeEnd == null) {
            return false;
        }
        // 세그먼트 끝이 구간 시작보다 크고, 세그먼트 시작이 구간 끝보다 작으면 겹침
        return segEnd > rangeStart && segStart < rangeEnd;
    }

    // ==================== 클립 + 텍스트 조회 ====================

    /**
     * 레시피의 모든 클립 + 해당 구간 텍스트 조회
     */
    public List<ClipWithTextResponse> getClipsWithText(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + recipeId));

        List<RecipeClip> clips = clipRepository.findByRecipeOrderByIndexOrdAsc(recipe);

        return clips.stream()
                .map(clip -> {
                    List<TranscriptSegmentDto> segments = getSegmentsForTimeRange(
                            recipeId, clip.getStartSec(), clip.getEndSec());

                    String transcriptText = segments.stream()
                            .map(TranscriptSegmentDto::getText)
                            .collect(Collectors.joining(" "));

                    return ClipWithTextResponse.fromEntityWithText(clip, transcriptText, segments);
                })
                .collect(Collectors.toList());
    }

    /**
     * 특정 클립 + 해당 구간 텍스트 조회
     */
    public ClipWithTextResponse getClipWithText(Long clipId) {
        RecipeClip clip = clipRepository.findById(clipId)
                .orElseThrow(() -> new IllegalArgumentException("클립을 찾을 수 없습니다: " + clipId));

        Long recipeId = clip.getRecipe().getId();
        List<TranscriptSegmentDto> segments = getSegmentsForTimeRange(
                recipeId, clip.getStartSec(), clip.getEndSec());

        String transcriptText = segments.stream()
                .map(TranscriptSegmentDto::getText)
                .collect(Collectors.joining(" "));

        return ClipWithTextResponse.fromEntityWithText(clip, transcriptText, segments);
    }

    // ==================== 수동 텍스트 입력 ====================

    /**
     * 클립 캡션 수동 입력/수정
     */
    @Transactional
    public ClipWithTextResponse updateClipCaption(Long clipId, String caption) {
        RecipeClip clip = clipRepository.findById(clipId)
                .orElseThrow(() -> new IllegalArgumentException("클립을 찾을 수 없습니다: " + clipId));

        clip.setCaption(caption);
        clipRepository.save(clip);

        log.info("클립 캡션 수정: clipId={}", clipId);
        return getClipWithText(clipId);
    }

    /**
     * 전체 전사 텍스트 수동 입력/수정
     */
    @Transactional
    public TranscriptResponse updateFullText(Long recipeId, String fullText) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + recipeId));

        RecipeTranscriptMeta meta = metaRepository.findByRecipe(recipe)
                .orElse(RecipeTranscriptMeta.builder()
                        .recipe(recipe)
                        .status(RecipeTranscriptMeta.TranscriptStatus.PENDING)
                        .build());

        meta.setFullText(fullText);

        // NO_AUDIO나 FAILED 상태면 COMPLETED로 변경
        if (meta.getStatus() == RecipeTranscriptMeta.TranscriptStatus.NO_AUDIO ||
                meta.getStatus() == RecipeTranscriptMeta.TranscriptStatus.FAILED) {
            meta.setStatus(RecipeTranscriptMeta.TranscriptStatus.COMPLETED);
            meta.setErrorMessage(null);
        }

        metaRepository.save(meta);
        log.info("전체 텍스트 수정: recipeId={}", recipeId);

        return getTranscript(recipeId);
    }

    /**
     * 세그먼트 개별 텍스트 수정
     */
    @Transactional
    public TranscriptSegmentDto updateSegmentText(Long segmentId, String text) {
        RecipeClipSegment segment = segmentRepository.findById(segmentId)
                .orElseThrow(() -> new IllegalArgumentException("세그먼트를 찾을 수 없습니다: " + segmentId));

        segment.setText(text);
        segmentRepository.save(segment);

        log.info("세그먼트 텍스트 수정: segmentId={}", segmentId);
        return TranscriptSegmentDto.fromEntity(segment);
    }
}
