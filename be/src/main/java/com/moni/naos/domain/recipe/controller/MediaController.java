package com.moni.naos.domain.recipe.controller;

import com.moni.naos.domain.recipe.dto.PresignedUrlResponse;
import com.moni.naos.domain.recipe.service.MediaPipelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * MediaController - 미디어 업로드 API
 * - 영상, 이미지, 썸네일, 프로필 이미지 업로드
 * - S3 Presigned URL 방식으로 서버 부하 최소화
 */
@Tag(name = "Media", description = "미디어 업로드 API")
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaPipelineService mediaPipelineService;

    @Operation(summary = "영상 업로드 URL 발급", description = "레시피 영상 업로드용 Presigned URL을 발급합니다.")
    @PostMapping("/presigned-url/video")
    public ResponseEntity<PresignedUrlResponse> getVideoPresignedUrl(
            @AuthenticationPrincipal Long userId,
            @RequestParam String fileName,
            @RequestParam(defaultValue = "video/mp4") String contentType
    ) {
        PresignedUrlResponse response = mediaPipelineService.generateVideoPresignedUrl(userId, fileName, contentType);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "이미지 업로드 URL 발급", description = "일반 이미지 업로드용 Presigned URL을 발급합니다.")
    @PostMapping("/presigned-url/image")
    public ResponseEntity<PresignedUrlResponse> getImagePresignedUrl(
            @AuthenticationPrincipal Long userId,
            @RequestParam String fileName,
            @RequestParam(defaultValue = "image/jpeg") String contentType
    ) {
        PresignedUrlResponse response = mediaPipelineService.generateImagePresignedUrl(userId, fileName, contentType);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "썸네일 업로드 URL 발급", description = "레시피 썸네일 업로드용 Presigned URL을 발급합니다.")
    @PostMapping("/presigned-url/thumbnail")
    public ResponseEntity<PresignedUrlResponse> getThumbnailPresignedUrl(
            @AuthenticationPrincipal Long userId,
            @RequestParam String fileName,
            @RequestParam(defaultValue = "image/jpeg") String contentType
    ) {
        PresignedUrlResponse response = mediaPipelineService.generateThumbnailPresignedUrl(userId, fileName, contentType);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "프로필 이미지 업로드 URL 발급", description = "프로필 사진 업로드용 Presigned URL을 발급합니다.")
    @PostMapping("/presigned-url/profile")
    public ResponseEntity<PresignedUrlResponse> getProfileImagePresignedUrl(
            @AuthenticationPrincipal Long userId,
            @RequestParam String fileName,
            @RequestParam(defaultValue = "image/jpeg") String contentType
    ) {
        PresignedUrlResponse response = mediaPipelineService.generateProfileImagePresignedUrl(userId, fileName, contentType);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "업로드 완료 콜백", description = "S3 업로드 완료 후 호출하여 DB에 저장합니다.")
    @PostMapping("/complete")
    public ResponseEntity<Map<String, String>> completeUpload(
            @AuthenticationPrincipal Long userId,
            @RequestParam Long recipeId,
            @RequestParam String type,  // VIDEO or THUMB
            @RequestParam String url
    ) {
        mediaPipelineService.completeUpload(userId, recipeId, type, url);
        return ResponseEntity.ok(Map.of("status", "success", "message", "업로드 완료"));
    }

    @Operation(summary = "파일 삭제", description = "S3에서 파일을 삭제합니다.")
    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteFile(
            @AuthenticationPrincipal Long userId,
            @RequestParam String url
    ) {
        String key = mediaPipelineService.extractKeyFromUrl(url);
        if (key != null) {
            mediaPipelineService.deleteFile(key);
            return ResponseEntity.ok(Map.of("status", "success", "message", "파일 삭제 완료"));
        }
        return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "잘못된 URL입니다."));
    }
}
