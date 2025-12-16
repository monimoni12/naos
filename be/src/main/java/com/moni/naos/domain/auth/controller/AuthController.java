package com.moni.naos.domain.auth.controller;

import com.moni.naos.domain.auth.dto.*;
import com.moni.naos.domain.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthController - 인증 관련 API
 * - 인스타그램 스타일 단계별 회원가입
 * - 이메일 또는 사용자명으로 로그인
 */
@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ==================== 회원가입 단계별 API ====================

    @Operation(summary = "이메일 중복 확인")
    @GetMapping("/check-email")
    public ResponseEntity<CheckResponse> checkEmail(@RequestParam String email) {
        boolean available = !authService.existsByEmail(email);
        String message = available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.";
        return ResponseEntity.ok(new CheckResponse(available, message));
    }

    @Operation(summary = "사용자명 중복 확인", description = "영문, 숫자, 밑줄, 마침표만 가능. 예약어 불가.")
    @GetMapping("/check-username")
    public ResponseEntity<CheckResponse> checkUsername(@RequestParam String username) {
        boolean available = authService.isUsernameAvailable(username);
        String message = available ? "사용 가능한 사용자명입니다." : "사용할 수 없는 사용자명입니다.";
        return ResponseEntity.ok(new CheckResponse(available, message));
    }

    @Operation(summary = "이메일 인증 코드 발송", description = "6자리 인증 코드를 이메일로 발송합니다.")
    @PostMapping("/send-verification")
    public ResponseEntity<Map<String, String>> sendVerification(@Valid @RequestBody EmailRequest request) {
        authService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "인증 코드가 발송되었습니다."));
    }

    @Operation(summary = "이메일 인증 코드 확인")
    @PostMapping("/verify-email")
    public ResponseEntity<VerifyResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        boolean verified = authService.verifyEmailCode(request.getEmail(), request.getCode());
        String message = verified ? "이메일 인증이 완료되었습니다." : "인증 코드가 일치하지 않습니다.";
        return ResponseEntity.ok(new VerifyResponse(verified, message));
    }

    @Operation(summary = "회원가입", description = "이메일, 비밀번호, 사용자명, 성명(선택), 생년월일(선택)")
    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest request) {
        SignupResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    // ==================== 로그인/로그아웃 ====================

    @Operation(summary = "로그인", description = "이메일 또는 사용자명으로 로그인")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        // deviceInfo, ipAddress 자동 추출
        String deviceInfo = extractDeviceInfo(httpRequest);
        String ipAddress = extractIpAddress(httpRequest);
        
        LoginResponse response = authService.login(request.getIdentifier(), request.getPassword(), deviceInfo, ipAddress);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        LoginResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "로그아웃", description = "현재 기기에서 로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        authService.logout(refreshToken);
        return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
    }

    @Operation(summary = "모든 기기에서 로그아웃")
    @PostMapping("/logout-all")
    public ResponseEntity<Map<String, String>> logoutAll(@RequestParam Long userId) {
        authService.logoutAll(userId);
        return ResponseEntity.ok(Map.of("message", "모든 기기에서 로그아웃 되었습니다."));
    }

    // ==================== Helper ====================

    /**
     * User-Agent 헤더에서 기기 정보 추출
     */
    private String extractDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown Device";
        }
        // 간단한 파싱 (실제로는 더 정교하게 할 수 있음)
        if (userAgent.contains("Mobile")) {
            return "Mobile";
        } else if (userAgent.contains("Chrome")) {
            return "Chrome";
        } else if (userAgent.contains("Firefox")) {
            return "Firefox";
        } else if (userAgent.contains("Safari")) {
            return "Safari";
        }
        return userAgent.length() > 100 ? userAgent.substring(0, 100) : userAgent;
    }

    /**
     * IP 주소 추출 (프록시 고려)
     */
    private String extractIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For는 쉼표로 구분된 여러 IP일 수 있음 (첫 번째가 원본)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
