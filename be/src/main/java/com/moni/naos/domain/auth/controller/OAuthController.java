package com.moni.naos.domain.auth.controller;

import com.moni.naos.domain.auth.service.OAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * OAuthController - 소셜 로그인 API
 * - Google, Kakao, Naver 등 OAuth 로그인
 */
@Tag(name = "OAuth", description = "소셜 로그인 API")
@RestController
@RequestMapping("/api/auth/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthService oAuthService;

    /**
     * Google 로그인 URL 요청
     */
    @Operation(summary = "Google 로그인", description = "Google OAuth 인증 URL을 반환합니다.")
    @GetMapping("/google")
    public ResponseEntity<String> googleLogin() {
        String authUrl = oAuthService.getGoogleAuthUrl();
        return ResponseEntity.ok(authUrl);
    }

    /**
     * Google 콜백 처리
     */
    @Operation(summary = "Google 콜백", description = "Google OAuth 콜백을 처리합니다.")
    @GetMapping("/google/callback")
    public ResponseEntity<?> googleCallback(
            @RequestParam String code
    ) {
        // TODO: Google OAuth 처리 구현
        return ResponseEntity.ok().build();
    }

    /**
     * Kakao 로그인 URL 요청
     */
    @Operation(summary = "Kakao 로그인", description = "Kakao OAuth 인증 URL을 반환합니다.")
    @GetMapping("/kakao")
    public ResponseEntity<String> kakaoLogin() {
        String authUrl = oAuthService.getKakaoAuthUrl();
        return ResponseEntity.ok(authUrl);
    }

    /**
     * Kakao 콜백 처리
     */
    @Operation(summary = "Kakao 콜백", description = "Kakao OAuth 콜백을 처리합니다.")
    @GetMapping("/kakao/callback")
    public ResponseEntity<?> kakaoCallback(
            @RequestParam String code
    ) {
        // TODO: Kakao OAuth 처리 구현
        return ResponseEntity.ok().build();
    }

    /**
     * Naver 로그인 URL 요청
     */
    @Operation(summary = "Naver 로그인", description = "Naver OAuth 인증 URL을 반환합니다.")
    @GetMapping("/naver")
    public ResponseEntity<String> naverLogin() {
        String authUrl = oAuthService.getNaverAuthUrl();
        return ResponseEntity.ok(authUrl);
    }

    /**
     * Naver 콜백 처리
     */
    @Operation(summary = "Naver 콜백", description = "Naver OAuth 콜백을 처리합니다.")
    @GetMapping("/naver/callback")
    public ResponseEntity<?> naverCallback(
            @RequestParam String code,
            @RequestParam String state
    ) {
        // TODO: Naver OAuth 처리 구현
        return ResponseEntity.ok().build();
    }
}
