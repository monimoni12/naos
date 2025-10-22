package com.moni.naos.domain.interaction.report.entity;

import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name="reports",
        indexes = {
                @Index(name="idx_report_target", columnList="targetType, targetId"),
                @Index(name="idx_report_status", columnList="status, createdAt")
        })
public class Report {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    /** 게시물/댓글/유저 등 신고 대상 */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TargetType targetType;

    @Column(nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 255)
    private String reason; // “스팸”, “욕설”, “음란물” 등 선택

    @Column(length = 500)
    private String detail; // 사용자가 직접 입력한 신고 내용

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Status status = Status.PENDING;

    private Instant reviewedAt;

    public enum TargetType { RECIPE, COMMENT, USER }
    public enum Status { PENDING, REVIEWED, REJECTED }
}
