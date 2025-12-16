package com.moni.naos.domain.user.entity;

// import com.moni.naos.domain.reward.entity.Badge;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * User - 인증 및 권한
 * - 로그인에 필요한 최소 정보만
 * - Profile과 1:1 관계
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users",
        indexes = {
                @Index(name="idx_user_email", columnList="email", unique=true)
        //        @Index(name="idx_user_username", columnList="username", unique=true),
        //        @Index(name="idx_user_nickname", columnList="nickname")
        })
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 로그인용 이메일 (고유) */
    @Column(nullable=false, unique=true, length=255)
    private String email;

    /** 비밀번호 해시 */
    @Column(nullable=false, length=255)
    private String passwordHash;

//    /** 라우팅 슬러그: /user/{username} */
//    @Column(nullable=false, unique=true, length=30)
//    private String username;
//
//    /** 화면표시용 닉네임(중복 허용) */
//    @Column(nullable=false, length=50)
//    private String nickname;
//
//    @Column(length=512)
//    private String avatarUrl;
//
//    @Column(length=500)
//    private String bio;
//
//    @Column(nullable=false)
//    @Builder.Default
//    private Integer points = 0;

    /** Role 엔티티 연결 */
    /** 권한 (USER/ADMIN) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /** 프로필 (1:1) */
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Profile profile;

//    /** 프로필에 표시할 대표 배지(선택) */
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "primary_badge_id")
//    private Badge primaryBadge;

    /** 계정 활성화 여부 */
    @Column(nullable=false)
    @Builder.Default
    private Boolean active = true;

    /** 이메일 인증 완료 여부 */
    @Column(nullable=false)
    @Builder.Default
    private Boolean emailVerified = false;
}
