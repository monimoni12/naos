package com.moni.naos.domain.auth.entity;

import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * RefreshToken - JWT 리프레시 토큰
 * - 액세스 토큰 갱신용
 * - 여러 디바이스 동시 로그인 지원 (User:RefreshToken = 1:N)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_token", columnList = "token"),
                @Index(name = "idx_refresh_user", columnList = "user_id")
        })
public class RefreshToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 토큰 소유자 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 리프레시 토큰 값 (UUID 등) */
    @Column(nullable = false, unique = true, length = 512)
    private String token;

    /** 만료 시간 */
    @Column(nullable = false)
    private Instant expiresAt;

    /** 디바이스 정보 (선택) */
    @Column(length = 255)
    private String deviceInfo;

    /** IP 주소 (선택) */
    @Column(length = 45)
    private String ipAddress;

    /** 토큰 폐기 여부 */
    @Column(nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    /**
     * 토큰 만료 여부 확인
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * 토큰 유효성 확인 (만료되지 않고 폐기되지 않음)
     */
    public boolean isValid() {
        return !isExpired() && !revoked;
    }

    /**
     * 토큰 폐기
     */
    public void revoke() {
        this.revoked = true;
    }
}
