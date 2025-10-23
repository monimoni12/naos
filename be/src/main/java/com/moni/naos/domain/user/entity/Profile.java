package com.moni.naos.domain.user.entity;

import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "profiles",
        indexes = {
                @Index(name = "idx_profile_user", columnList = "user_id", unique = true)
        })
public class Profile extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 프로필은 유저당 1개 (고정) */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** 공개용 소개/웹사이트 등 — User와 중복돼도 무방(점진적 이전용) */
    @Column(length = 500)
    private String bio;           // 공개 소개(선택)

    @Column(length = 512)
    private String avatarUrl;     // 공개 아바타(선택)

    @Column(length = 120)
    private String website;       // 개인 링크(선택)

    @Column(length = 120)
    private String location;      // 위치(선택)
}
