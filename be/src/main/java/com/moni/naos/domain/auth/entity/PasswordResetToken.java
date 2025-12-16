package com.moni.naos.domain.auth.entity;

import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * PasswordResetToken - 비밀번호 재설정 토큰
 * - "비밀번호 찾기" 기능용
 * - 일정 시간 후 만료
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "password_reset_tokens",
        indexes = {
                @Index(name = "idx_reset_token", columnList = "token"),
                @Index(name = "idx_reset_user", columnList = "user_id")
        })
public class PasswordResetToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 비밀번호 재설정 대상 User */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 재설정 토큰 (UUID 등) */
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /** 만료 시간 (보통 30분~1시간) */
    @Column(nullable = false)
    private Instant expiresAt;

    /** 사용 완료 여부 */
    @Column(nullable = false)
    @Builder.Default
    private Boolean used = false;

    /** 사용 완료 시간 */
    private Instant usedAt;

    /**
     * 토큰 만료 여부 확인
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * 토큰 유효성 확인 (만료되지 않고 아직 사용 안됨)
     */
    public boolean isValid() {
        return !isExpired() && !used;
    }

    /**
     * 토큰 사용 완료 처리
     */
    public void markAsUsed() {
        this.used = true;
        this.usedAt = Instant.now();
    }
}
