package com.moni.naos.domain.reward.dto;

import lombok.*;

/** 리워드 정책(행위→점수) DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardPolicyDto {
    private String actionCode; // e.g. POST_CREATE, COMMENT_CREATE
    private int points;        // 적립 점수
    private String description;
}
