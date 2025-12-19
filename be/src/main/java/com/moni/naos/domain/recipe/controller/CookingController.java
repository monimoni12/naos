package com.moni.naos.domain.recipe.controller;

import com.moni.naos.domain.recipe.dto.CookingSessionResponse;
import com.moni.naos.domain.recipe.dto.RecipeProgressResponse;
import com.moni.naos.domain.recipe.service.CookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Cooking", description = "요리 세션 API")
@RestController
@RequestMapping("/api/cooking")
@RequiredArgsConstructor
public class CookingController {

    private final CookingService cookingService;

    @Operation(summary = "요리 시작")
    @PostMapping("/start/{recipeId}")
    public ResponseEntity<CookingSessionResponse> startCooking(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        CookingSessionResponse response = cookingService.startCooking(userId, recipeId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "요리 종료 (세션 ID)")
    @PostMapping("/end/{sessionId}")
    public ResponseEntity<CookingSessionResponse> endCooking(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long sessionId
    ) {
        CookingSessionResponse response = cookingService.endCooking(userId, sessionId);
        return ResponseEntity.ok(response);
    }

    // ⭐ 추가: 레시피 ID로 종료
    @Operation(summary = "요리 종료 (레시피 ID)")
    @PostMapping("/end/recipe/{recipeId}")
    public ResponseEntity<CookingSessionResponse> endCookingByRecipe(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        CookingSessionResponse response = cookingService.endCookingByRecipe(userId, recipeId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "진행 상황 업데이트")
    @PutMapping("/progress/{recipeId}")
    public ResponseEntity<RecipeProgressResponse> updateProgress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId,
            @RequestParam int step
    ) {
        RecipeProgressResponse response = cookingService.updateProgress(userId, recipeId, step);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "진행 상황 조회")
    @GetMapping("/progress/{recipeId}")
    public ResponseEntity<RecipeProgressResponse> getProgress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        RecipeProgressResponse response = cookingService.getProgress(userId, recipeId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "활성 세션 조회 (단일)")
    @GetMapping("/active")
    public ResponseEntity<CookingSessionResponse> getActiveSession(
            @AuthenticationPrincipal Long userId
    ) {
        CookingSessionResponse response = cookingService.getActiveSession(userId);
        return ResponseEntity.ok(response);
    }

    // ⭐ 추가: 활성 세션 목록 (여러 개)
    @Operation(summary = "활성 세션 목록 조회")
    @GetMapping("/active/all")
    public ResponseEntity<List<CookingSessionResponse>> getActiveSessions(
            @AuthenticationPrincipal Long userId
    ) {
        List<CookingSessionResponse> response = cookingService.getActiveSessions(userId);
        return ResponseEntity.ok(response);
    }

    // ⭐ 추가: 특정 레시피 요리 상태
    @Operation(summary = "특정 레시피 요리 상태 확인")
    @GetMapping("/{recipeId}/status")
    public ResponseEntity<Map<String, Object>> getCookingStatus(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId
    ) {
        boolean isCooking = cookingService.isCooking(userId, recipeId);
        RecipeProgressResponse progress = cookingService.getProgress(userId, recipeId);
        
        return ResponseEntity.ok(Map.of(
                "recipeId", recipeId,
                "isCooking", isCooking,
                "progress", progress
        ));
    }

    @Operation(summary = "요리 기록 조회")
    @GetMapping("/history")
    public ResponseEntity<List<CookingSessionResponse>> getCookingHistory(
            @AuthenticationPrincipal Long userId
    ) {
        List<CookingSessionResponse> response = cookingService.getCookingHistory(userId);
        return ResponseEntity.ok(response);
    }
}
