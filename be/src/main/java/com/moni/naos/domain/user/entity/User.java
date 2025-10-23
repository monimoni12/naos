package com.moni.naos.domain.user.entity;

import com.moni.naos.domain.reward.entity.Badge;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users",
        indexes = {
                @Index(name="idx_user_email", columnList="email", unique=true),
                @Index(name="idx_user_username", columnList="username", unique=true),
                @Index(name="idx_user_nickname", columnList="nickname")
        })
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true, length=255)
    private String email;

    @Column(nullable=false, length=255)
    private String passwordHash;

    /** 라우팅 슬러그: /user/{username} */
    @Column(nullable=false, unique=true, length=30)
    private String username;

    /** 화면표시용 닉네임(중복 허용) */
    @Column(nullable=false, length=50)
    private String nickname;

    @Column(length=512)
    private String avatarUrl;

    @Column(length=500)
    private String bio;

    /** Role 엔티티 연결 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /** 프로필에 표시할 대표 배지(선택) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_badge_id")
    private Badge primaryBadge;
}
