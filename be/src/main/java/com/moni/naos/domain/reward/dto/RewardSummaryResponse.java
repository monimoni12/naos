package com.moni.naos.domain.reward.dto;

import lombok.*;
import java.util.List;

/** 리워드 요약 응답 DTO(페이지 상단 요약 카드) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardSummaryResponse {
    private int balance;              // 현재 포인트
    private String currentTier;       // 현재 등급 (e.g. Diet Newbie)
    private List<String> badges;      // 보유 배지 라벨 목록
    private List<RewardPolicyDto> policies; // 주요 정책 리스트
}
