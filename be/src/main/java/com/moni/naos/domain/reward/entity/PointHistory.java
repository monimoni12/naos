package com.moni.naos.domain.reward.entity;

import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * 포인트 거래 원장(적립/차감 내역)
 * - action: 수행된 정책 스냅샷(문자)
 * - delta : 증감 값
 * - balance: 거래 이후 잔액 스냅샷 (빠른 조회용)
 * - refType/refId: 어떤 리소스 때문인지 추적 (RECIPE/COMMENT 등)
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "point_history",
        indexes = {
                @Index(name = "idx_point_user_created", columnList = "user_id, createdAt DESC")
        })
public class PointHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    /** 정책 코드 스냅샷 */
    @Column(nullable = false, length = 40)
    private String action;

    /** 적립/차감 값 */
    @Column(nullable = false)
    private Integer delta;

    /** 거래 후 잔액 스냅샷 */
    @Column(nullable = false)
    private Integer balance;

    /** 어떤 리소스(선택) 때문인지(감사 추적) */
    @Column(length = 20)
    private String refType; // RECIPE, COMMENT, BADGE, etc.

    private Long refId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
