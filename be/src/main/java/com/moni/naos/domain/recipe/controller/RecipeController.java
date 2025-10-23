package com.moni.naos.domain.recipe.controller;

import com.moni.naos.domain.recipe.dto.RecipeRequest;
import com.moni.naos.domain.recipe.dto.RecipeResponse;
import com.moni.naos.domain.recipe.service.RecipeService;
import com.moni.naos.global.rsdata.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RecipeController
 * - 레시피 CRUD (Create / Read / Update / Delete)
 * - Swagger에서 직접 테스트 가능 (/swagger-ui/index.html)
 */
@Tag(name = "Recipe", description = "레시피 CRUD API")
@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @Operation(summary = "레시피 등록", description = "새로운 레시피를 등록합니다.")
    @PostMapping
    public ApiResponse<RecipeResponse> createRecipe(@RequestBody RecipeRequest request) {
        RecipeResponse created = recipeService.createRecipe(request);
        return ApiResponse.success(created, "레시피 등록 완료");
    }

    @Operation(summary = "전체 레시피 조회", description = "모든 레시피를 조회합니다.")
    @GetMapping
    public ApiResponse<List<RecipeResponse>> getAllRecipes() {
        return ApiResponse.success(recipeService.getAllRecipes(), "레시피 전체 조회");
    }

    @Operation(summary = "레시피 상세 조회", description = "ID로 특정 레시피를 조회합니다.")
    @GetMapping("/{id}")
    public ApiResponse<RecipeResponse> getRecipe(@PathVariable Long id) {
        return ApiResponse.success(recipeService.getRecipeById(id), "레시피 상세 조회");
    }

    @Operation(summary = "레시피 수정", description = "기존 레시피를 수정합니다.")
    @PutMapping("/{id}")
    public ApiResponse<RecipeResponse> updateRecipe(
            @PathVariable Long id,
            @RequestBody RecipeRequest request
    ) {
        RecipeResponse updated = recipeService.updateRecipe(id, request);
        return ApiResponse.success(updated, "레시피 수정 완료");
    }

    @Operation(summary = "레시피 삭제", description = "ID로 레시피를 삭제합니다.")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRecipe(@PathVariable Long id) {
        recipeService.deleteRecipe(id);
        return ApiResponse.success(null, "레시피 삭제 완료");
    }
}
