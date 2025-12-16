package com.moni.naos.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * RecipeTranscriptMeta - 전사 메타데이터
 * 
 * 실제 세그먼트 데이터는 RecipeClipSegment에 저장
 * 이 엔티티는 전사 상태/메타 정보만 관리
 */
@Entity
@Table(name = "recipe_transcript_meta",
        indexes = @Index(name = "idx_transcript_meta_recipe", columnList = "recipe_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeTranscriptMeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 연결된 레시피 (1:1)
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false, unique = true)
    private Recipe recipe;

    /**
     * 전체 전사 텍스트 (세그먼트 합친 것, 검색용)
     */
    @Lob
    private String fullText;

    /**
     * 감지된 언어 (ko, en, ja 등)
     */
    @Column(length = 10)
    private String detectedLanguage;

    /**
     * 영상 총 길이 (초)
     */
    private Double durationSec;

    /**
     * 세그먼트 개수
     */
    private Integer segmentCount;

    /**
     * 전사 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private TranscriptStatus status = TranscriptStatus.PENDING;

    /**
     * 에러 메시지 (실패 시)
     */
    @Column(length = 500)
    private String errorMessage;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    /**
     * 전사 상태
     */
    public enum TranscriptStatus {
        PENDING,      // 대기중
        PROCESSING,   // 처리중
        COMPLETED,    // 완료
        FAILED,       // 실패
        NO_AUDIO      // 음성 없음 (수동 입력 필요)
    }

    /**
     * 전사 시작
     */
    public void startProcessing() {
        this.status = TranscriptStatus.PROCESSING;
        this.errorMessage = null;
    }

    /**
     * 전사 완료
     */
    public void complete(String fullText, int segmentCount, Double duration, String language) {
        this.fullText = fullText;
        this.segmentCount = segmentCount;
        this.durationSec = duration;
        this.detectedLanguage = language;
        this.status = TranscriptStatus.COMPLETED;
        this.errorMessage = null;
    }

    /**
     * 전사 실패
     */
    public void fail(String errorMessage) {
        this.status = TranscriptStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    /**
     * 음성 없음
     */
    public void markNoAudio() {
        this.status = TranscriptStatus.NO_AUDIO;
        this.errorMessage = "영상에 음성이 감지되지 않았습니다. 수동으로 텍스트를 입력해주세요.";
    }

    /**
     * 완료 여부
     */
    public boolean isCompleted() {
        return status == TranscriptStatus.COMPLETED;
    }
}
