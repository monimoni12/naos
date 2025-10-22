package com.moni.naos.domain.reward.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 포인트 등급 정의 (예: BRONZE 0, SILVER 1000, GOLD 3000 ...)
 * - minPoints 이상이면 해당 등급에 진입
 * - displayOrder로 정렬(낮을수록 먼저)
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "reward_tiers",
        indexes = {
                @Index(name = "idx_tier_min_points", columnList = "minPoints"),
                @Index(name = "idx_tier_display_order", columnList = "displayOrder")
        })
public class RewardTier {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 내부 코드 (유니크) ex) BRONZE, SILVER */
    @Column(nullable = false, unique = true, length = 30)
    private String code;

    /** 화면 표시명 ex) "실버 등급" */
    @Column(nullable = false, length = 50)
    private String name;

    /** 해당 등급의 시작 포인트 임계값 */
    @Column(nullable = false)
    private Integer minPoints;

    /** 정렬 우선순위(낮을수록 상위에 배치) */
    @Column(nullable = false)
    private Integer displayOrder = 0;

    /** (선택) 배지 아이콘 등 */
    @Column(length = 512)
    private String iconUrl;
}
