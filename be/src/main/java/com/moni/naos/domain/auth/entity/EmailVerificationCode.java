package com.moni.naos.domain.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * EmailVerificationCode - 이메일 인증 코드
 * - 회원가입 전 이메일 검증용 (인스타 스타일)
 * - 6자리 코드, 5분 유효
 * - 기존 EmailVerificationToken과 별도 (Token은 회원가입 후 인증용)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "email_verification_codes",
        indexes = @Index(name = "idx_verification_code_email", columnList = "email"))
public class EmailVerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이메일 주소 */
    @Column(nullable = false, length = 100)
    private String email;

    /** 6자리 인증 코드 */
    @Column(nullable = false, length = 10)
    private String code;

    /** 만료 시간 */
    @Column(nullable = false)
    private Instant expiresAt;

    /** 인증 완료 여부 */
    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    /** 생성 시간 */
    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /**
     * 만료 여부 확인
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * 인증 처리
     */
    public void verify() {
        this.verified = true;
    }
}
