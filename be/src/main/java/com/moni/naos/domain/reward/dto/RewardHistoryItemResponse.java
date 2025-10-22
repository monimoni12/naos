package com.moni.naos.domain.reward.dto;

import lombok.*;
import java.time.Instant;

/** 포인트 적립/차감 내역(리스트 아이템) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardHistoryItemResponse {
    private Long id;
    private String actionCode; // 어떤 행위로 인한 변동인지
    private int delta;         // +100 / -50
    private int balanceAfter;  // 변동 후 잔액
    private Instant createdAt;
}
