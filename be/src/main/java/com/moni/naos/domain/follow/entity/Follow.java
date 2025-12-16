package com.moni.naos.domain.follow.entity;

import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="follows",
        uniqueConstraints=@UniqueConstraint(name="uq_follow", columnNames={"follower_id","followee_id"}))
public class Follow {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    /** 팔로우하는 사람 (나) */
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="follower_id", nullable = false)
    private User follower;

    /** 팔로우 당하는 사람 (상대) */
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="followee_id", nullable = false)
    private User followee;
}
