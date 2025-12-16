package com.moni.naos.domain.auth.entity;

import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * EmailVerificationToken - 이메일 인증 토큰
 * - 회원가입 시 이메일 인증용
 * - 일정 시간 후 만료
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "email_verification_tokens",
        indexes = {
                @Index(name = "idx_email_token", columnList = "token"),
                @Index(name = "idx_email_user", columnList = "user_id")
        })
public class EmailVerificationToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 인증 대상 User */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** 인증 토큰 (UUID 등) */
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /** 만료 시간 */
    @Column(nullable = false)
    private Instant expiresAt;

    /** 인증 완료 여부 */
    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

    /** 인증 완료 시간 */
    private Instant verifiedAt;

    /**
     * 토큰 만료 여부 확인
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * 토큰 유효성 확인 (만료되지 않고 아직 인증 안됨)
     */
    public boolean isValid() {
        return !isExpired() && !verified;
    }

    /**
     * 이메일 인증 완료 처리
     */
    public void verify() {
        this.verified = true;
        this.verifiedAt = Instant.now();
    }
}
