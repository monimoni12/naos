package com.moni.naos.domain.recipe.service;

import com.moni.naos.domain.recipe.dto.RecipeRequest;
import com.moni.naos.domain.recipe.dto.RecipeResponse;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * RecipeService
 * 레시피 생성/조회/수정/삭제
 * 일부 필드는 null 허용 (AI나 후처리 단계에서 채워질 예정)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeService {

    private final RecipeRepository recipeRepository;

    /** 레시피 생성 */
    @Transactional
    public RecipeResponse createRecipe(RecipeRequest req) {

        // “description” 필드는 엔티티에 없고 caption으로 대체됨
        Recipe recipe = Recipe.builder()
                .title(req.getTitle())             // 레시피 이름 (AI 자동 or 수동 입력)
                .caption(req.getCaption())         // 게시물 메시지
                .category(req.getCategory())       // 카테고리 선택 항목
                .servings(req.getServings())       // 인분 수 (비워도 가능)
                .cookTimeMin(req.getCookTimeMin()) // 조리 시간 (비워도 가능)
                .priceEstimate(req.getPriceEstimate()) // AI 계산 예정
                .kcalEstimate(req.getKcalEstimate())   // AI 계산 예정
                .hideLikeCount(req.isHideLikeCount())  // 공개 설정
                .hideShareCount(req.isHideShareCount())
                .disableComments(req.isDisableComments())
                .build();

        Recipe saved = recipeRepository.save(recipe);
        return RecipeResponse.fromEntity(saved);
    }

    /** 전체 레시피 목록 */
    public List<RecipeResponse> getAllRecipes() {
        return recipeRepository.findAll()
                .stream()
                .map(RecipeResponse::fromEntity)
                .toList();
    }

    /** 단일 레시피 조회 */
    public RecipeResponse getRecipeById(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + id));
        return RecipeResponse.fromEntity(recipe);
    }

    /** 수정 (AI나 유저가 나중에 세부 내용 편집) */
    @Transactional
    public RecipeResponse updateRecipe(Long id, RecipeRequest req) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + id));

        // 일부 값은 null 허용 (AI 계산 단계에서 채워질 수 있음)
        recipe.setTitle(req.getTitle());
        recipe.setCaption(req.getCaption());
        recipe.setCategory(req.getCategory());
        recipe.setServings(req.getServings());
        recipe.setCookTimeMin(req.getCookTimeMin());
        recipe.setPriceEstimate(req.getPriceEstimate());
        recipe.setKcalEstimate(req.getKcalEstimate());
        recipe.setHideLikeCount(req.isHideLikeCount());
        recipe.setHideShareCount(req.isHideShareCount());
        recipe.setDisableComments(req.isDisableComments());

        return RecipeResponse.fromEntity(recipeRepository.save(recipe));
    }

    /** 삭제 */
    @Transactional
    public void deleteRecipe(Long id) {
        recipeRepository.deleteById(id);
    }
}
