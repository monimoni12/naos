package com.moni.naos.domain.user.dto;

import com.moni.naos.domain.user.entity.Profile;
import lombok.*;

/**
 * 프로필 응답 DTO
 * - 공개 프로필 정보
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {

    private Long id;
    private Long userId;
    private String username;      // @아이디
    private String fullName;      // ⭐ 성명 (nickname → fullName)
    private String avatarUrl;     // 프로필 이미지
    private String bio;           // 소개
    private Integer points;       // 포인트
    private String website;       // 웹사이트
    private String location;      // 위치
    private Boolean isPublic;     // 공개 여부

    // 통계 (추후 추가 가능)
    private Integer recipeCount;   // 레시피 수
    private Integer followerCount; // 팔로워 수
    private Integer followingCount;// 팔로잉 수

    // 배지 (추후 추가)
    private String primaryBadgeCode;
    private String primaryBadgeTitle;

    /**
     * Entity → DTO 변환
     */
    public static ProfileResponse fromEntity(Profile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .username(profile.getUsername())
                .fullName(profile.getFullName())  // ⭐ 변경
                .avatarUrl(profile.getAvatarUrl())
                .bio(profile.getBio())
                .points(profile.getPoints())
                .website(profile.getWebsite())
                .location(profile.getLocation())
                .isPublic(profile.getIsPublic())
                // 통계는 별도 쿼리 필요 (현재는 null)
                .recipeCount(null)
                .followerCount(null)
                .followingCount(null)
                // 배지 정보
                .primaryBadgeCode(profile.getPrimaryBadge() != null ? profile.getPrimaryBadge().getCode() : null)
                .primaryBadgeTitle(profile.getPrimaryBadge() != null ? profile.getPrimaryBadge().getTitle() : null)
                .build();
    }

    /**
     * Entity → DTO 변환 (통계 포함)
     */
    public static ProfileResponse fromEntityWithStats(Profile profile, int recipeCount, int followerCount, int followingCount) {
        ProfileResponse response = fromEntity(profile);
        response.setRecipeCount(recipeCount);
        response.setFollowerCount(followerCount);
        response.setFollowingCount(followingCount);
        return response;
    }
}
