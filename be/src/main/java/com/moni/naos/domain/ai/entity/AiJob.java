package com.moni.naos.domain.ai.entity;

import com.moni.naos.domain.user.entity.User;
import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="ai_jobs",
        indexes=@Index(name="idx_aijob_status_created", columnList="status, createdAt"))
public class AiJob extends BaseEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=15)
    private Kind kind; // SCRIPT / NUTRITION / GENERATE

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=10)
    private Status status = Status.PENDING; // PENDING/RUNNING/DONE/FAIL

    @Lob @Column(nullable=false) private String payloadJson;
    private String resultRef;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="requested_by")
    private User requestedBy;

    public enum Kind { SCRIPT, NUTRITION, GENERATE }
    public enum Status { PENDING, RUNNING, DONE, FAIL }
}
