package com.moni.naos.domain.interaction.comment.controller;

import com.moni.naos.domain.interaction.comment.dto.CommentCreateRequest;
import com.moni.naos.domain.interaction.comment.dto.CommentResponse;
import com.moni.naos.domain.interaction.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CommentController - 댓글 API
 */
@Tag(name = "Comment", description = "댓글 API")
@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // ==================== 댓글 CRUD ====================

    @Operation(summary = "댓글 작성")
    @PostMapping("/api/recipes/{recipeId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        CommentResponse response = commentService.create(userId, recipeId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "댓글 목록 조회")
    @GetMapping("/api/recipes/{recipeId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        List<CommentResponse> response = commentService.getByRecipe(recipeId, userId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "댓글 수 조회")
    @GetMapping("/api/recipes/{recipeId}/comments/count")
    public ResponseEntity<Map<String, Long>> getCommentCount(
            @PathVariable Long recipeId
    ) {
        long count = commentService.getCommentCount(recipeId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @Operation(summary = "댓글 수정")
    @PutMapping("/api/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        CommentResponse response = commentService.update(userId, commentId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId
    ) {
        commentService.delete(userId, commentId);
        return ResponseEntity.ok().build();
    }

    // ==================== 댓글 좋아요 ====================

    @Operation(summary = "댓글 좋아요 토글")
    @PostMapping("/api/comments/{commentId}/likes")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId
    ) {
        boolean liked = commentService.toggleLike(userId, commentId);
        long count = commentService.getLikeCount(commentId);
        return ResponseEntity.ok(Map.of("liked", liked, "count", count));
    }

    @Operation(summary = "댓글 좋아요 수 조회")
    @GetMapping("/api/comments/{commentId}/likes")
    public ResponseEntity<Map<String, Long>> getCommentLikeCount(
            @PathVariable Long commentId
    ) {
        long count = commentService.getLikeCount(commentId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
