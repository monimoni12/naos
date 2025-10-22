package com.moni.naos.domain.reward.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 포인트 적립/차감 정책
 * - action: 비즈니스 행위 코드 (예: RECIPE_UPLOAD, LIKE_RECEIVED, COMMENT_WRITE)
 * - delta : 가산(+)/차감(-) 포인트
 * - active: 비활성화하면 적용 안 됨
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "reward_policies",
        indexes = @Index(name = "idx_policy_active", columnList = "active"))
public class RewardPolicy {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 정책 키 (유니크) */
    @Column(nullable = false, unique = true, length = 40)
    private String action;

    /** 포인트 증감 값(+/-) */
    @Column(nullable = false)
    private Integer delta;

    /** 화면에 노출할 설명(선택) */
    @Column(length = 100)
    private String title; // 예: "레시피 업로드"

    /** 활성화 여부 */
    @Column(nullable = false)
    private Boolean active = true;

    /** (선택) 추가 비고 */
    @Column(length = 255)
    private String note;
}
