package com.moni.naos.domain.recipe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * RecipeIngredient - 레시피 재료
 * 
 * 레시피에 포함된 재료 정보
 * GPT 가성비 분석에 사용됨
 */
@Entity
@Table(name = "recipe_ingredient",
        indexes = @Index(name = "idx_ingredient_recipe", columnList = "recipe_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 연결된 레시피
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    /**
     * 재료명
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 양 (예: "150g", "1/2컵", "1개")
     */
    @Column(length = 50)
    private String amount;

    /**
     * 예상 가격 (원)
     */
    private Integer price;

    /**
     * 순서
     */
    @Column(name = "order_index")
    private Integer orderIndex;

    /**
     * 단위 (선택, 구조화된 데이터용)
     */
    @Column(length = 20)
    private String unit;

    /**
     * 수량 (선택, 구조화된 데이터용)
     */
    private Double quantity;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
