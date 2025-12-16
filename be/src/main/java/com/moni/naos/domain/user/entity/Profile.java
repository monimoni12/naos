package com.moni.naos.domain.user.entity;

import com.moni.naos.domain.reward.entity.Badge;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Profile - 인스타그램 스타일 공개 프로필
 * - /user/{username} 라우팅
 * - 모든 공개 정보 포함
 */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "profiles",
        indexes = {
                @Index(name="idx_profile_username", columnList="username", unique=true),
                @Index(name="idx_profile_fullname", columnList="full_name")
        })
public class Profile extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 프로필은 User와 1:1 관계 */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** 라우팅 슬러그: /user/{username} (인스타 @아이디) */
    @Column(nullable=false, unique=true, length=30)
    private String username;

    /** 성명 (인스타 full_name) - 화면 표시용 */
    @Column(name = "full_name", nullable=false, length=50)
    private String fullName;

    /** 프로필 이미지 URL */
    @Column(length = 512)
    private String avatarUrl;

    /** 자기소개 */
    @Column(length=500)
    private String bio;

    /** 생년월일 (선택) */
    private LocalDate birthDate;

    /** 포인트 잔액 */
    @Column(nullable=false)
    @Builder.Default
    private Integer points = 0;

    /** 프로필에 표시할 대표 배지 (선택) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_badge_id")
    private Badge primaryBadge;

    /** 개인 링크(선택) */
    @Column(length = 120)
    private String website;

    /** 위치(선택) */
    @Column(length = 120)
    private String location;

    /** 프로필 공개 여부 */
    @Column(nullable=false)
    @Builder.Default
    private Boolean isPublic = true;

    /**
     * 포인트 추가
     */
    public void addPoints(int amount) {
        this.points += amount;
    }

    /**
     * 포인트 차감
     */
    public void deductPoints(int amount) {
        if (this.points < amount) {
            throw new IllegalStateException("포인트가 부족합니다.");
        }
        this.points -= amount;
    }
}
