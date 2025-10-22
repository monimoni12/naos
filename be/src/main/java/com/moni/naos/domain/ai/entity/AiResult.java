package com.moni.naos.domain.ai.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="ai_results")
public class AiResult {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="job_id", unique=true)
    private AiJob job;

    @Lob @Column(nullable=false) private String resultJson;
}
