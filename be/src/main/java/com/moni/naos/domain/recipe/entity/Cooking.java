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
        name = "cooking_session",
        // ⭐ uniqueConstraint 제거 → 같은 레시피 여러 번 요리 기록 허용
        indexes = {
                @Index(name = "idx_cooking_user_started", columnList = "user_id, startedAt"),
                @Index(name = "idx_cooking_user_recipe_active", columnList = "user_id, recipe_id, active")
        }
)
public class Cooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant startedAt = Instant.now();

    private Instant endedAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    public void endCooking() {
        this.endedAt = Instant.now();
        this.active = false;
    }

    public boolean isActive() {
        return active && endedAt == null;
    }
}
