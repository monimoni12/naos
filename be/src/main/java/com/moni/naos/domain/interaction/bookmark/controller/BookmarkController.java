package com.moni.naos.domain.interaction.bookmark.controller;

import com.moni.naos.domain.interaction.bookmark.service.BookmarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BookmarkController - 북마크(스크랩) API
 */
@Tag(name = "Bookmark", description = "북마크 API")
@RestController
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @Operation(summary = "북마크 토글", description = "북마크 추가/취소")
    @PostMapping("/api/recipes/{recipeId}/bookmarks")
    public ResponseEntity<Map<String, Object>> toggleBookmark(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        boolean bookmarked = bookmarkService.toggle(userId, recipeId);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }

    @Operation(summary = "내 북마크 목록")
    @GetMapping("/api/users/me/bookmarks")
    public ResponseEntity<List<Long>> getMyBookmarks(
            @AuthenticationPrincipal Long userId
    ) {
        List<Long> recipeIds = bookmarkService.getBookmarkedRecipeIds(userId);
        return ResponseEntity.ok(recipeIds);
    }

    @Operation(summary = "북마크 여부 확인")
    @GetMapping("/api/recipes/{recipeId}/bookmarks")
    public ResponseEntity<Map<String, Object>> checkBookmark(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        boolean bookmarked = bookmarkService.isBookmarked(userId, recipeId);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }
}
