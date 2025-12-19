package com.moni.naos.domain.recipe.service;

import com.moni.naos.domain.recipe.dto.PresignedUrlResponse;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeAsset;
import com.moni.naos.domain.recipe.repository.RecipeAssetRepository;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.global.storage.S3Properties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;

/**
 * MediaPipelineService - 미디어 업로드 비즈니스 로직
 * - S3 Presigned URL 발급
 * - 업로드 완료 처리
 * - 파일 삭제
 * 
 * 수정사항:
 * - contentType을 Presigned URL 서명에서 제외 (CORS preflight 문제 해결)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MediaPipelineService {

    private final RecipeRepository recipeRepository;
    private final RecipeAssetRepository recipeAssetRepository;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties s3Properties;

    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;

    // Presigned URL 유효 시간 (15분)
    private static final Duration PRESIGN_DURATION = Duration.ofMinutes(15);

    /**
     * 영상 업로드용 Presigned URL 발급
     */
    public PresignedUrlResponse generateVideoPresignedUrl(Long userId, String fileName, String contentType) {
        String key = generateS3Key("videos", userId, fileName);
        return generatePresignedUrl(key);
    }

    /**
     * 이미지 업로드용 Presigned URL 발급
     */
    public PresignedUrlResponse generateImagePresignedUrl(Long userId, String fileName, String contentType) {
        String key = generateS3Key("images", userId, fileName);
        return generatePresignedUrl(key);
    }

    /**
     * 썸네일 업로드용 Presigned URL 발급
     */
    public PresignedUrlResponse generateThumbnailPresignedUrl(Long userId, String fileName, String contentType) {
        String key = generateS3Key("thumbnails", userId, fileName);
        return generatePresignedUrl(key);
    }

    /**
     * 프로필 이미지 업로드용 Presigned URL 발급
     */
    public PresignedUrlResponse generateProfileImagePresignedUrl(Long userId, String fileName, String contentType) {
        String key = generateS3Key("profiles", userId, fileName);
        return generatePresignedUrl(key);
    }

    /**
     * S3 Key 생성 (폴더/유저ID/UUID.확장자)
     */
    private String generateS3Key(String folder, Long userId, String fileName) {
        String uuid = UUID.randomUUID().toString();
        String extension = "";
        if (fileName != null && fileName.contains(".")) {
            extension = fileName.substring(fileName.lastIndexOf("."));
        }
        return String.format("%s/%d/%s%s", folder, userId, uuid, extension);
    }

    /**
     * Presigned URL 생성 (실제 S3 연동)
     * ⚠️ 수정: contentType을 서명에서 제외하여 CORS preflight 문제 해결
     */
    private PresignedUrlResponse generatePresignedUrl(String key) {
        String bucketName = s3Properties.getBucket();

        // PutObject 요청 생성 (contentType 제외!)
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                // .contentType(contentType)  // 제거: CORS preflight 403 문제 해결
                .build();

        // Presigned URL 요청 생성
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(PRESIGN_DURATION)
                .putObjectRequest(putObjectRequest)
                .build();

        // Presigned URL 생성
        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        String uploadUrl = presignedRequest.url().toString();

        // 업로드 후 접근할 URL
        String publicUrl = String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucketName, region, key);

        log.info("Presigned URL 생성: key={}, expires={}분", key, PRESIGN_DURATION.toMinutes());

        return PresignedUrlResponse.builder()
                .uploadUrl(uploadUrl)
                .publicUrl(publicUrl)
                .key(key)
                .expiresIn((int) PRESIGN_DURATION.toSeconds())
                .build();
    }

    /**
     * 업로드 완료 처리 - Enum 타입 직접 사용
     */
    @Transactional
    public void completeUpload(Long userId, Long recipeId, RecipeAsset.Type type, String url) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        if (recipe.getAuthor() != null && !recipe.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 레시피만 수정할 수 있습니다.");
        }

        RecipeAsset asset = RecipeAsset.builder()
                .recipe(recipe)
                .type(type)
                .url(url)
                .build();

        recipeAssetRepository.save(asset);
        log.info("미디어 업로드 완료 - Recipe: {}, Type: {}", recipeId, type);
    }

    /**
     * 업로드 완료 처리 - String 타입 받아서 변환
     */
    @Transactional
    public void completeUpload(Long userId, Long recipeId, String typeStr, String url) {
        RecipeAsset.Type type = RecipeAsset.Type.valueOf(typeStr.toUpperCase());
        completeUpload(userId, recipeId, type, url);
    }

    /**
     * S3 파일 삭제
     */
    public void deleteFile(String key) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(s3Properties.getBucket())
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("S3 파일 삭제: key={}", key);
        } catch (Exception e) {
            log.error("S3 파일 삭제 실패: key={}, error={}", key, e.getMessage());
        }
    }

    /**
     * URL에서 S3 Key 추출
     */
    public String extractKeyFromUrl(String url) {
        String bucketName = s3Properties.getBucket();
        String prefix = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);
        if (url.startsWith(prefix)) {
            return url.substring(prefix.length());
        }
        return null;
    }
}
