package com.moni.naos.domain.recipe.entity;

import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.converter.StringListJsonConverter;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="recipes",
        indexes = {
                @Index(name="idx_recipe_author_created", columnList="author_id, createdAt DESC"),
                @Index(name="idx_recipe_created",       columnList="createdAt DESC"),
                @Index(name="idx_recipe_score_popular", columnList="scorePopular DESC"),
                @Index(name="idx_recipe_score_cost",    columnList="scoreCost DESC")
        })
public class Recipe extends BaseEntity {

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="author_id")
    private User author;

    @Column(nullable=false, length=200) private String title;
    @Lob private String caption;

    @Column(length=50) private String category;

    @Convert(converter=StringListJsonConverter.class)
    @Column(columnDefinition="TEXT") private List<String> dietTags;

    private Integer servings;        // 인분
    private Integer cookTimeMin;     // 분
    private Integer priceEstimate;   // 1인분 추정 가격
    private Integer kcalEstimate;    // 1인분 추정 칼로리

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=15)
    private Visibility visibility = Visibility.PUBLIC;

    private boolean hideLikeCount;
    private boolean hideShareCount;
    private boolean disableComments;

    private Double scorePopular = 0d;
    private Double scoreCost    = 0d;

    public enum Visibility { PUBLIC, FOLLOWERS, PRIVATE }
}
