package com.moni.naos.domain.auth.entity;

import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * OauthAccount - 소셜 로그인 계정
 * - Google, Kakao, Naver 등 외부 OAuth 연동
 * - 한 User가 여러 소셜 계정 연결 가능 (1:N)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "oauth_accounts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_oauth_provider_id", 
                        columnNames = {"provider", "provider_id"})
        },
        indexes = {
                @Index(name = "idx_oauth_user", columnList = "user_id")
        })
public class OauthAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 연결된 User */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** OAuth 제공자 (GOOGLE, KAKAO, NAVER 등) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OauthProvider provider;

    /** 제공자에서 발급한 고유 ID */
    @Column(name = "provider_id", nullable = false, length = 255)
    private String providerId;

    /** 제공자에서 받은 이메일 (선택) */
    @Column(length = 255)
    private String providerEmail;

    /** 제공자에서 받은 프로필 이미지 (선택) */
    @Column(length = 512)
    private String providerAvatarUrl;

    /** 액세스 토큰 (선택, 필요 시 저장) */
    @Column(length = 1024)
    private String accessToken;

    /** 리프레시 토큰 (선택) */
    @Column(length = 1024)
    private String refreshToken;

    /**
     * OAuth 제공자 종류
     */
    public enum OauthProvider {
        GOOGLE,
        KAKAO,
        NAVER,
        APPLE
    }
}
