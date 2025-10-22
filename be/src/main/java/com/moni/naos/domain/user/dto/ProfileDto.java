package com.moni.naos.domain.user.dto;

import lombok.*;

/** 프로필 기본 정보 DTO (마이페이지/프로필 수정용) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileDto {
    private Long id;
    private String nickname;
    private String bio;
    private String avatarUrl;
    private int points;          // 현재 포인트(요약)
    private String representativeBadge; // 대표 배지 라벨
}
