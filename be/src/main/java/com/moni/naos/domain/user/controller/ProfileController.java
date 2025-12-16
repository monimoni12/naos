package com.moni.naos.domain.user.controller;

import com.moni.naos.domain.user.dto.ProfileResponse;
import com.moni.naos.domain.user.dto.ProfileUpdateRequest;
import com.moni.naos.domain.user.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * ProfileController - 프로필 관련 API
 * - 프로필 조회 (공개)
 * - 프로필 수정 (본인만)
 */
@Tag(name = "Profile", description = "프로필 API")
@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /**
     * username으로 프로필 조회 (공개)
     * GET /api/profiles/{username}
     */
    @Operation(summary = "프로필 조회", description = "username으로 프로필을 조회합니다.")
    @GetMapping("/{username}")
    public ResponseEntity<ProfileResponse> getProfile(
            @PathVariable String username
    ) {
        ProfileResponse response = profileService.getProfileByUsername(username);
        return ResponseEntity.ok(response);
    }

    /**
     * 내 프로필 조회
     * GET /api/profiles/me
     */
    @Operation(summary = "내 프로필 조회", description = "로그인한 사용자의 프로필을 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile(
            @AuthenticationPrincipal Long userId
    ) {
        ProfileResponse response = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 프로필 수정
     * PUT /api/profiles/me
     */
    @Operation(summary = "프로필 수정", description = "로그인한 사용자의 프로필을 수정합니다.")
    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        ProfileResponse response = profileService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 내 포인트 조회
     * GET /api/profiles/me/points
     */
    @Operation(summary = "포인트 조회", description = "로그인한 사용자의 포인트를 조회합니다.")
    @GetMapping("/me/points")
    public ResponseEntity<Integer> getMyPoints(
            @AuthenticationPrincipal Long userId
    ) {
        int points = profileService.getPoints(userId);
        return ResponseEntity.ok(points);
    }
}
