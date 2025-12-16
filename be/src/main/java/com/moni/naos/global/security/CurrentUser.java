package com.moni.naos.global.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.lang.annotation.*;

/**
 * 현재 인증된 사용자 ID를 주입받는 어노테이션
 * 
 * 사용법:
 * @GetMapping("/me")
 * public ResponseEntity<?> getMe(@CurrentUser Long userId) {
 *     // userId 사용
 * }
 */
@Target({ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {
}
