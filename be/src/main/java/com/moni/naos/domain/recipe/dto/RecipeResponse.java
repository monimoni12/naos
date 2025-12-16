package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.Recipe;
import lombok.*;

/**
 * 레시피 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeResponse {

    private Long id;
    private String title;
    private String caption;
    private String category;
    private String authorName;      // ⭐ 성명 (fullName)
    private String authorUsername;
    private Integer servings;
    private Integer cookTimeMin;
    private Integer priceEstimate;
    private Integer kcalEstimate;
    private boolean hideLikeCount;
    private boolean hideShareCount;
    private boolean disableComments;
    private Double scorePopular;
    private Double scoreCost;
    private String visibility;      // PUBLIC, FOLLOWERS, PRIVATE
    private boolean liked;
    private boolean bookmarked;

    public static RecipeResponse fromEntity(Recipe recipe) {
        String authorName = null;
        String authorUsername = null;

        if (recipe.getAuthor() != null && recipe.getAuthor().getProfile() != null) {
            authorName = recipe.getAuthor().getProfile().getFullName();  // ⭐ 변경
            authorUsername = recipe.getAuthor().getProfile().getUsername();
        }

        return RecipeResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .caption(recipe.getCaption())
                .category(recipe.getCategory())
                .authorName(authorName)
                .authorUsername(authorUsername)
                .servings(recipe.getServings())
                .cookTimeMin(recipe.getCookTimeMin())
                .priceEstimate(recipe.getPriceEstimate())
                .kcalEstimate(recipe.getKcalEstimate())
                .hideLikeCount(recipe.isHideLikeCount())
                .hideShareCount(recipe.isHideShareCount())
                .disableComments(recipe.isDisableComments())
                .scorePopular(recipe.getScorePopular())
                .scoreCost(recipe.getScoreCost())
                .visibility(recipe.getVisibility().name())
                .liked(false)
                .bookmarked(false)
                .build();
    }
}
