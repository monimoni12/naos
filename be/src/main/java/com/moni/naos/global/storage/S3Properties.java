package com.moni.naos.global.storage;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AWS S3 버킷 설정
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "cloud.aws.s3")
public class S3Properties {

    /** S3 버킷 이름 */
    private String bucket = "naos-bucket";

    // ==================== 경로 상수 ====================

    /** 레시피 영상 경로 */
    public String getVideoPath(Long recipeId, String filename) {
        return String.format("recipes/%d/videos/%s", recipeId, filename);
    }

    /** 레시피 썸네일 경로 */
    public String getThumbnailPath(Long recipeId, String filename) {
        return String.format("recipes/%d/thumbnails/%s", recipeId, filename);
    }

    /** 프로필 이미지 경로 */
    public String getProfilePath(Long userId, String filename) {
        return String.format("profiles/%d/%s", userId, filename);
    }
}
