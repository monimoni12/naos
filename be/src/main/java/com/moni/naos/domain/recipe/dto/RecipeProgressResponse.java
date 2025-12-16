package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.RecipeProgress;
import lombok.*;

import java.time.Instant;

/**
 * 레시피 진행 상황 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeProgressResponse {

    private Long id;
    private Long recipeId;
    private String recipeTitle;
    private int totalSteps;
    private int progressStep;
    private double progressPercent;
    private boolean completed;
    private Instant startedAt;
    private Instant completedAt;
    private Instant updatedAt;

    public static RecipeProgressResponse fromEntity(RecipeProgress progress) {
        double percent = progress.getTotalSteps() > 0
                ? (double) progress.getProgressStep() / progress.getTotalSteps() * 100
                : 0;

        return RecipeProgressResponse.builder()
                .id(progress.getId())
                .recipeId(progress.getRecipe().getId())
                .recipeTitle(progress.getRecipe().getTitle())
                .totalSteps(progress.getTotalSteps())
                .progressStep(progress.getProgressStep())
                .progressPercent(Math.round(percent * 10) / 10.0)
                .completed(progress.isCompleted())
                .startedAt(progress.getStartedAt())
                .completedAt(progress.getCompletedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}
