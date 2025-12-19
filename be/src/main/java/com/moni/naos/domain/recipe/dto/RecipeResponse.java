package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeAsset;
import lombok.*;

import java.util.List;

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
    private Long authorId;
    private String authorName;
    private String authorUsername;
    private String authorAvatarUrl;
    private Integer servings;
    private Integer cookTimeMin;
    private Integer priceEstimate;
    private Integer kcalEstimate;
    private boolean hideLikeCount;
    private boolean hideShareCount;
    private boolean disableComments;
    private Double scorePopular;
    private Double costEfficiencyScore;  // 변경: scoreCost → costEfficiencyScore
    private String visibility;
    private boolean liked;
    private boolean bookmarked;
    
    // 미디어 URL
    private String thumbnailUrl;
    private String videoUrl;

    /**
     * 기본 변환 (assets 없이)
     */
    public static RecipeResponse fromEntity(Recipe recipe) {
        return fromEntity(recipe, null);
    }

    /**
     * assets 포함 변환
     */
    public static RecipeResponse fromEntity(Recipe recipe, List<RecipeAsset> assets) {
        Long authorId = null;
        String authorName = null;
        String authorUsername = null;
        String authorAvatarUrl = null;

        if (recipe.getAuthor() != null) {
            authorId = recipe.getAuthor().getId();
            if (recipe.getAuthor().getProfile() != null) {
                authorName = recipe.getAuthor().getProfile().getFullName();
                authorUsername = recipe.getAuthor().getProfile().getUsername();
                authorAvatarUrl = recipe.getAuthor().getProfile().getAvatarUrl();
            }
        }

        // Asset에서 썸네일/비디오 URL 추출
        String thumbnailUrl = null;
        String videoUrl = null;
        
        if (assets != null) {
            for (RecipeAsset asset : assets) {
                if (asset.getType() == RecipeAsset.Type.THUMB) {
                    thumbnailUrl = asset.getUrl();
                } else if (asset.getType() == RecipeAsset.Type.VIDEO) {
                    videoUrl = asset.getUrl();
                }
            }
        }

        return RecipeResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .caption(recipe.getCaption())
                .category(recipe.getCategory())
                .authorId(authorId)
                .authorName(authorName)
                .authorUsername(authorUsername)
                .authorAvatarUrl(authorAvatarUrl)
                .servings(recipe.getServings())
                .cookTimeMin(recipe.getCookTimeMin())
                .priceEstimate(recipe.getPriceEstimate())
                .kcalEstimate(recipe.getKcalEstimate())
                .hideLikeCount(recipe.isHideLikeCount())
                .hideShareCount(recipe.isHideShareCount())
                .disableComments(recipe.isDisableComments())
                .scorePopular(recipe.getScorePopular())
                .costEfficiencyScore(recipe.getCostEfficiencyScore())  // 변경
                .visibility(recipe.getVisibility().name())
                .liked(false)
                .bookmarked(false)
                .thumbnailUrl(thumbnailUrl)
                .videoUrl(videoUrl)
                .build();
    }
}
