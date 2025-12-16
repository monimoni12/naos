package com.moni.naos.domain.user.controller;

import com.moni.naos.domain.user.dto.UserResponse;
import com.moni.naos.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * UserController - 유저 관련 API
 * - 유저 조회
 * - 계정 관리
 */
@Tag(name = "User", description = "유저 API")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 내 정보 조회
     * GET /api/users/me
     */
    @Operation(summary = "내 정보 조회", description = "로그인한 사용자의 정보를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(
            @AuthenticationPrincipal Long userId
    ) {
        UserResponse response = userService.getUserById(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * ID로 유저 조회
     * GET /api/users/{id}
     */
    @Operation(summary = "유저 조회", description = "ID로 유저를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(
            @PathVariable Long id
    ) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 계정 비활성화 (본인만)
     * DELETE /api/users/me
     */
    @Operation(summary = "계정 비활성화", description = "본인 계정을 비활성화합니다.")
    @DeleteMapping("/me")
    public ResponseEntity<Void> deactivateAccount(
            @AuthenticationPrincipal Long userId
    ) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok().build();
    }
}
