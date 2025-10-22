package com.moni.naos.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="recipe_script_segments",
        uniqueConstraints=@UniqueConstraint(name="uq_recipe_seg", columnNames={"recipe_id","idx_ord"}))
public class RecipeScriptSegment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="recipe_id")
    private Recipe recipe;

    @Column(name="idx_ord", nullable=false) private Integer indexOrd;
    @Lob @Column(nullable=false) private String text;

    private Double startSec;
    private Double endSec;
}
