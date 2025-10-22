package com.moni.naos.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="recipe_clips",
        uniqueConstraints=@UniqueConstraint(name="uq_recipe_clip", columnNames={"recipe_id","idx_ord"}))
public class RecipeClip {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="recipe_id")
    private Recipe recipe;

    @Column(name="idx_ord", nullable=false) private Integer indexOrd; // 0..N
    @Column(nullable=false) private Double startSec;
    @Column(nullable=false) private Double endSec;
    @Column(length=500) private String caption;
}
