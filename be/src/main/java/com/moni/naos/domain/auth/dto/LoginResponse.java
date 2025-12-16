package com.moni.naos.domain.auth.dto;

import lombok.*;

/**
 * 로그인 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    // 토큰 정보
    private String accessToken;
    private String refreshToken;
    private String tokenType;    // "Bearer"
    private Long expiresIn;      // 초 단위 (3600 = 1시간)

    // 유저 정보
    private Long userId;
    private String email;
    private String username;
    private String fullName;
    private String avatarUrl;
}
