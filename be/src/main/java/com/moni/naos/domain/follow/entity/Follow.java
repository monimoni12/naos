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

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="follower_id")
    private User follower;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="followee_id")
    private User followee;
}
