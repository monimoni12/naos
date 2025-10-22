package com.moni.naos.domain.interaction.comment.entity;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="comments",
        indexes=@Index(name="idx_comment_recipe_created", columnList="recipe_id, createdAt"))
public class Comment extends BaseEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="recipe_id")
    private Recipe recipe;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id")
    private User user;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="parent_id")
    private Comment parent; // 대댓글

    @Lob @Column(nullable=false) private String text;
    private java.time.Instant deletedAt;
}
