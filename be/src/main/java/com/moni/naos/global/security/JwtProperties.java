package com.moni.naos.global.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 설정 Properties
 * - application.yml의 custom.jwt, custom.accessToken, custom.refreshToken 바인딩
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "custom")
public class JwtProperties {

    private Jwt jwt = new Jwt();
    private Token accessToken = new Token();
    private Token refreshToken = new Token();

    @Getter
    @Setter
    public static class Jwt {
        /** JWT 서명용 비밀 키 */
        private String secretKey;
    }

    @Getter
    @Setter
    public static class Token {
        /** 토큰 만료 시간 (초) */
        private long expirationSeconds;
    }

    // ==================== 편의 메서드 ====================

    /** 비밀 키 */
    public String getSecretKey() {
        return jwt.getSecretKey();
    }

    /** Access Token 만료 시간 (ms) */
    public long getAccessTokenExpirationMs() {
        return accessToken.getExpirationSeconds() * 1000;
    }

    /** Refresh Token 만료 시간 (ms) */
    public long getRefreshTokenExpirationMs() {
        return refreshToken.getExpirationSeconds() * 1000;
    }

    /** Access Token 만료 시간 (초) */
    public long getAccessTokenExpirationSeconds() {
        return accessToken.getExpirationSeconds();
    }

    /** Refresh Token 만료 시간 (초) */
    public long getRefreshTokenExpirationSeconds() {
        return refreshToken.getExpirationSeconds();
    }
}
