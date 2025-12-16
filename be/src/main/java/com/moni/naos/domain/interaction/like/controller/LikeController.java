package com.moni.naos.domain.interaction.like.controller;

import com.moni.naos.domain.interaction.like.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * LikeController - 좋아요 API
 */
@Tag(name = "Like", description = "좋아요 API")
@RestController
@RequestMapping("/api/recipes/{recipeId}/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @Operation(summary = "좋아요 토글", description = "좋아요 추가/취소")
    @PostMapping
    public ResponseEntity<Map<String, Object>> toggleLike(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        boolean liked = likeService.toggle(userId, recipeId);
        long count = likeService.getCount(recipeId);
        return ResponseEntity.ok(Map.of("liked", liked, "count", count));
    }

    @Operation(summary = "좋아요 상태 확인")
    @GetMapping
    public ResponseEntity<Map<String, Object>> checkLike(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        boolean liked = likeService.isLiked(userId, recipeId);
        long count = likeService.getCount(recipeId);
        return ResponseEntity.ok(Map.of("liked", liked, "count", count));
    }
}
