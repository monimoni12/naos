package com.moni.naos.domain.recipe.controller;

import com.moni.naos.domain.recipe.dto.*;
import com.moni.naos.domain.recipe.service.RecipeService;
import com.moni.naos.global.rsdata.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RecipeController - 레시피 CRUD + 업로드 플로우 API
 *
 * 업로드 플로우:
 * 1. POST /draft           - 임시 레시피 생성 (영상 업로드 후)
 * 2. PUT /{id}/clips       - 클립 정보 저장 (클리핑 완료 후)
 * 3. PUT /{id}/thumbnail   - 썸네일 설정
 * 4. PUT /{id}/details     - 상세 정보 입력
 * 5. POST /{id}/analyze    - AI 분석 요청
 * 6. POST /{id}/publish    - 최종 발행
 */
@Tag(name = "Recipe", description = "레시피 API")
@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    // ==================== 업로드 플로우 ====================

    @Operation(summary = "임시 레시피 생성", description = "영상 업로드 후 임시 레시피를 생성합니다. title만 선택적으로 입력.")
    @PostMapping("/draft")
    public ResponseEntity<RecipeResponse> createDraft(
            @AuthenticationPrincipal Long userId,
            @RequestBody DraftCreateRequest request
    ) {
        RecipeResponse response = recipeService.createDraft(userId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "클립 정보 저장", description = "클리핑한 클립 정보를 저장합니다.")
    @PutMapping("/{id}/clips")
    public ResponseEntity<RecipeResponse> saveClips(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody List<ClipCreateRequest> clips
    ) {
        RecipeResponse response = recipeService.saveClips(userId, id, clips);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "썸네일 설정", description = "레시피 썸네일을 설정합니다.")
    @PutMapping("/{id}/thumbnail")
    public ResponseEntity<RecipeResponse> setThumbnail(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody AssetRequest request
    ) {
        RecipeResponse response = recipeService.setThumbnail(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "상세 정보 입력", description = "레시피 상세 정보를 입력합니다.")
    @PutMapping("/{id}/details")
    public ResponseEntity<RecipeResponse> saveDetails(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody RecipeRequest request
    ) {
        RecipeResponse response = recipeService.saveDetails(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "AI 분석 요청", description = "재료 기반 AI 분석을 요청합니다.")
    @PostMapping("/{id}/analyze")
    public ResponseEntity<RecipeAnalysisResponse> requestAnalysis(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        RecipeAnalysisResponse response = recipeService.requestAnalysis(userId, id);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "레시피 발행", description = "레시피를 최종 발행합니다.")
    @PostMapping("/{id}/publish")
    public ResponseEntity<RecipeResponse> publish(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        RecipeResponse response = recipeService.publish(userId, id);
        return ResponseEntity.ok(response);
    }

    // ==================== 기본 CRUD ====================

    @Operation(summary = "레시피 등록")
    @PostMapping
    public ApiResponse<RecipeResponse> createRecipe(@RequestBody RecipeRequest request) {
        RecipeResponse created = recipeService.createRecipe(request);
        return ApiResponse.success(created, "레시피 등록 완료");
    }

    @Operation(summary = "전체 레시피 조회")
    @GetMapping
    public ApiResponse<List<RecipeResponse>> getAllRecipes() {
        return ApiResponse.success(recipeService.getAllRecipes(), "레시피 전체 조회");
    }

    @Operation(summary = "레시피 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<RecipeResponse> getRecipe(@PathVariable Long id) {
        return ApiResponse.success(recipeService.getRecipeById(id), "레시피 상세 조회");
    }

    @Operation(summary = "레시피 수정")
    @PutMapping("/{id}")
    public ApiResponse<RecipeResponse> updateRecipe(
            @PathVariable Long id,
            @RequestBody RecipeRequest request
    ) {
        RecipeResponse updated = recipeService.updateRecipe(id, request);
        return ApiResponse.success(updated, "레시피 수정 완료");
    }

    @Operation(summary = "레시피 삭제")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRecipe(@PathVariable Long id) {
        recipeService.deleteRecipe(id);
        return ApiResponse.success(null, "레시피 삭제 완료");
    }

    // ==================== 추가 기능 ====================

    @Operation(summary = "내 레시피 목록")
    @GetMapping("/me")
    public ResponseEntity<List<RecipeResponse>> getMyRecipes(
            @AuthenticationPrincipal Long userId
    ) {
        List<RecipeResponse> response = recipeService.getByAuthor(userId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 임시저장 목록")
    @GetMapping("/me/drafts")
    public ResponseEntity<List<RecipeResponse>> getMyDrafts(
            @AuthenticationPrincipal Long userId
    ) {
        List<RecipeResponse> response = recipeService.getDraftsByAuthor(userId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "카테고리별 레시피")
    @GetMapping("/category/{category}")
    public ResponseEntity<List<RecipeResponse>> getByCategory(
            @PathVariable String category
    ) {
        List<RecipeResponse> response = recipeService.getByCategory(category);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "피드")
    @GetMapping("/feed")
    public ResponseEntity<List<RecipeResponse>> getFeed(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        List<RecipeResponse> response = recipeService.getFeed(userId, page, size);
        return ResponseEntity.ok(response);
    }
}
