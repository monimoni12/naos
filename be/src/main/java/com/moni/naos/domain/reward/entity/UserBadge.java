package com.moni.naos.domain.reward.entity;

import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="user_badges",
        uniqueConstraints=@UniqueConstraint(name="uq_user_badge", columnNames={"user_id","badge_id"}),
        indexes=@Index(name="idx_userbadge_user", columnList="user_id"))
public class UserBadge {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id")  private User user;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="badge_id") private Badge badge;

    private Instant achievedAt; // 조건 달성
    private Instant claimedAt;  // “받기” 클릭

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=10)
    private Status status = Status.ACHIEVED; // ACHIEVED | CLAIMED

    public enum Status { ACHIEVED, CLAIMED }
}
