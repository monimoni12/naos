package com.moni.naos.domain.reward.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="badges", indexes=@Index(name="idx_badge_order", columnList="displayOrder"))
public class Badge {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true, length=50) private String code;     // "DIET_NEWBIE"
    @Column(nullable=false, length=100)             private String title;    // "Diet Newbie"
    @Column(length=255)                              private String subtitle;
    @Column(length=512)                              private String iconUrl;
    @Column(nullable=false)                          private Integer displayOrder = 0;

    private Integer pointsRequired; // 선택
    @Column(nullable=false) private Boolean active = true;
}
