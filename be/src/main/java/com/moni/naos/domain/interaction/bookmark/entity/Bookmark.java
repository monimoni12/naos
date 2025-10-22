package com.moni.naos.domain.interaction.bookmark.entity;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="bookmarks",
        uniqueConstraints=@UniqueConstraint(name="uq_bookmark", columnNames={"user_id","recipe_id"}),
        indexes=@Index(name="idx_bookmark_recipe_created", columnList="recipe_id, createdAt"))
public class Bookmark {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id")   private User user;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="recipe_id") private Recipe recipe;

    @Column(nullable=false, updatable=false) private Instant createdAt = Instant.now();
}
