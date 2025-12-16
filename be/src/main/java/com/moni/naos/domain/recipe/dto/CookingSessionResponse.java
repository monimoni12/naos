package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.Cooking;
import lombok.*;

import java.time.Instant;

/**
 * 요리 세션 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CookingSessionResponse {

    private Long id;
    private Long userId;
    private Long recipeId;
    private String recipeTitle;
    private Instant startedAt;
    private Instant endedAt;
    private boolean active;
    private Long durationSeconds;

    public static CookingSessionResponse fromEntity(Cooking cooking) {
        Long duration = null;
        if (cooking.getEndedAt() != null && cooking.getStartedAt() != null) {
            duration = cooking.getEndedAt().getEpochSecond() - cooking.getStartedAt().getEpochSecond();
        }

        return CookingSessionResponse.builder()
                .id(cooking.getId())
                .userId(cooking.getUser().getId())
                .recipeId(cooking.getRecipe().getId())
                .recipeTitle(cooking.getRecipe().getTitle())
                .startedAt(cooking.getStartedAt())
                .endedAt(cooking.getEndedAt())
                .active(cooking.isActive())
                .durationSeconds(duration)
                .build();
    }
}
