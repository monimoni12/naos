package com.moni.naos.domain.follow.controller;

import com.moni.naos.domain.follow.dto.FollowUserResponse;
import com.moni.naos.domain.follow.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FollowController - 팔로우 API
 */
@Tag(name = "Follow", description = "팔로우 API")
@RestController
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    // ==================== 팔로우 토글 ====================

    @Operation(summary = "팔로우 토글", description = "팔로우/언팔로우")
    @PostMapping("/api/users/{targetUserId}/follow")
    public ResponseEntity<Map<String, Object>> toggleFollow(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long targetUserId
    ) {
        boolean following = followService.toggle(userId, targetUserId);
        long followerCount = followService.getFollowerCount(targetUserId);
        return ResponseEntity.ok(Map.of(
                "following", following,
                "followerCount", followerCount
        ));
    }

    @Operation(summary = "팔로우 상태 확인")
    @GetMapping("/api/users/{targetUserId}/follow")
    public ResponseEntity<Map<String, Object>> checkFollow(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long targetUserId
    ) {
        boolean following = followService.isFollowing(userId, targetUserId);
        return ResponseEntity.ok(Map.of("following", following));
    }

    // ==================== 팔로워 목록 ====================

    @Operation(summary = "팔로워 목록 (ID만)")
    @GetMapping("/api/users/{userId}/followers/ids")
    public ResponseEntity<List<Long>> getFollowerIds(
            @PathVariable Long userId
    ) {
        List<Long> followerIds = followService.getFollowerIds(userId);
        return ResponseEntity.ok(followerIds);
    }

    @Operation(summary = "팔로워 목록 (상세)")
    @GetMapping("/api/users/{userId}/followers")
    public ResponseEntity<List<FollowUserResponse>> getFollowers(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long userId
    ) {
        List<FollowUserResponse> followers = followService.getFollowers(userId, currentUserId);
        return ResponseEntity.ok(followers);
    }

    // ==================== 팔로잉 목록 ====================

    @Operation(summary = "팔로잉 목록 (ID만)")
    @GetMapping("/api/users/{userId}/following/ids")
    public ResponseEntity<List<Long>> getFollowingIds(
            @PathVariable Long userId
    ) {
        List<Long> followingIds = followService.getFollowingIds(userId);
        return ResponseEntity.ok(followingIds);
    }

    @Operation(summary = "팔로잉 목록 (상세)")
    @GetMapping("/api/users/{userId}/following")
    public ResponseEntity<List<FollowUserResponse>> getFollowing(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long userId
    ) {
        List<FollowUserResponse> following = followService.getFollowing(userId, currentUserId);
        return ResponseEntity.ok(following);
    }

    // ==================== 카운트 ====================

    @Operation(summary = "팔로워/팔로잉 수")
    @GetMapping("/api/users/{userId}/follow/counts")
    public ResponseEntity<Map<String, Long>> getFollowCounts(
            @PathVariable Long userId
    ) {
        long followerCount = followService.getFollowerCount(userId);
        long followingCount = followService.getFollowingCount(userId);
        return ResponseEntity.ok(Map.of(
                "followerCount", followerCount,
                "followingCount", followingCount
        ));
    }

    @Operation(summary = "팔로워 수")
    @GetMapping("/api/users/{userId}/followers/count")
    public ResponseEntity<Map<String, Long>> getFollowerCount(
            @PathVariable Long userId
    ) {
        long count = followService.getFollowerCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @Operation(summary = "팔로잉 수")
    @GetMapping("/api/users/{userId}/following/count")
    public ResponseEntity<Map<String, Long>> getFollowingCount(
            @PathVariable Long userId
    ) {
        long count = followService.getFollowingCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
