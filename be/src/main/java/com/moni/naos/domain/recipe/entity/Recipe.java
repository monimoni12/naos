package com.moni.naos.domain.recipe.entity;

import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.converter.StringListJsonConverter;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="recipes",
        indexes = {
                @Index(name="idx_recipe_author_created", columnList="author_id, createdAt DESC"),
                @Index(name="idx_recipe_created",       columnList="createdAt DESC"),
                @Index(name="idx_recipe_score_popular", columnList="scorePopular DESC"),
                @Index(name="idx_recipe_cost_efficiency", columnList="cost_efficiency_score DESC")
        })
public class Recipe extends BaseEntity {

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="author_id")
    private User author;

    @Column(nullable=false, length=200) 
    private String title;
    
    @Lob 
    private String caption;

    @Column(length=50) 
    private String category;

    @Convert(converter=StringListJsonConverter.class)
    @Column(columnDefinition="TEXT") 
    private List<String> dietTags;

    private Integer servings;        // 인분
    private Integer cookTimeMin;     // 조리 시간 (분)
    private Integer priceEstimate;   // 1인분 추정 가격
    private Integer kcalEstimate;    // 1인분 추정 칼로리

    // 난이도
    @Enumerated(EnumType.STRING) 
    @Column(length=10)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING) 
    @Column(nullable=false, length=15)
    @Builder.Default
    private Visibility visibility = Visibility.PUBLIC;

    @Builder.Default
    private boolean hideLikeCount = false;
    
    @Builder.Default
    private boolean hideShareCount = false;
    
    @Builder.Default
    private boolean disableComments = false;

    @Builder.Default
    private Double scorePopular = 0d;
    
    @Column(name = "cost_efficiency_score")
    @Builder.Default
    private Double costEfficiencyScore = 0d;  // 변경: scoreCost → costEfficiencyScore

    // ==================== ⭐ 연관 관계 (Cascade 삭제) ====================
    
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RecipeAsset> assets = new ArrayList<>();
    
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RecipeClip> clips = new ArrayList<>();

    // ==================== Enums ====================

    public enum Visibility { PUBLIC, FOLLOWERS, PRIVATE }
    
    public enum Difficulty { EASY, MEDIUM, HARD }
}
