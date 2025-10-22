package com.moni.naos.domain.recipe.entity;

import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "recipe_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_progress_user_recipe",
                columnNames = {"user_id", "recipe_id"}
        ),
        indexes = @Index(
                name = "idx_progress_user_updated",
                columnList = "user_id, updatedAt"
        )
)
public class RecipeProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    // (선택) 현재 진행 중인 Cooking 세션 참조 — 추적용
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cooking_id")
    private Cooking cooking;

    @Column(nullable = false)
    private Integer totalSteps;

    @Column(nullable = false)
    private Integer progressStep = 0;

    @Column(nullable = false, updatable = false)
    private Instant startedAt = Instant.now();

    private Instant completedAt;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isCompleted() {
        return completedAt != null || progressStep >= totalSteps;
    }

    public void complete() {
        this.completedAt = Instant.now();
    }
}
