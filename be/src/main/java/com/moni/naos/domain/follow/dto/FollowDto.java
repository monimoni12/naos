package com.moni.naos.domain.follow.dto;

import lombok.*;

/** 팔로우/언팔로우 응답/목록 카드 DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FollowDto {
    private Long id;
    private Long followerId;
    private Long followingId;
    private boolean following; // 현재 사용자 기준 팔로잉 여부
}
