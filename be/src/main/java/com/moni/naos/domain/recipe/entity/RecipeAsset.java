package com.moni.naos.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="recipe_assets",
        indexes=@Index(name="idx_asset_recipe", columnList="recipe_id"))
public class RecipeAsset {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="recipe_id")
    private Recipe recipe;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=10)
    private Type type; // VIDEO | THUMB

    @Column(nullable=false, length=1024) private String url;
    private Integer durationS;

    public enum Type { VIDEO, THUMB }
}
