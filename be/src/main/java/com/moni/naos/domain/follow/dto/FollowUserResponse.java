package com.moni.naos.domain.follow.dto;

import lombok.*;

/**
 * 팔로워/팔로잉 유저 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUserResponse {

    private Long userId;
    private String fullName;      // ⭐ 성명 (nickname → fullName)
    private String username;      // @아이디
    private String profileUrl;    // 프로필 이미지 URL
    private boolean isFollowing;  // 현재 사용자가 팔로우 중인지
}
