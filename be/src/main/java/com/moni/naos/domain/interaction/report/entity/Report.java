package com.moni.naos.domain.interaction.report.entity;

import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Report - 신고 엔티티
 * 
 * 신고 유형 (reasonCode):
 * - SPAM: 스팸/광고
 * - INAPPROPRIATE: 부적절한 콘텐츠 (욕설, 비방)
 * - COPYRIGHT: 저작권 침해 (레시피 도용)
 * - OTHER: 기타
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reports",
        indexes = {
                @Index(name = "idx_report_target", columnList = "targetType, targetId"),
                @Index(name = "idx_report_status", columnList = "status, createdAt")
        })
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    /** 신고 대상 타입 */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TargetType targetType;

    /** 신고 대상 ID */
    @Column(nullable = false)
    private Long targetId;

    /** 신고 사유 코드 */
    @Column(nullable = false, length = 50)
    private String reason;

    /** 상세 설명 (선택) */
    @Column(length = 500)
    private String detail;

    /** 처리 상태 */
    @Builder.Default  // ✅ 추가됨
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Status status = Status.PENDING;

    /** 신고 일시 */
    @Builder.Default  // ✅ 추가됨
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /** 처리 일시 */
    private Instant reviewedAt;

    public enum TargetType {
        RECIPE,     // 레시피 게시물
        COMMENT,    // 댓글
        USER        // 유저
    }

    public enum Status {
        PENDING,    // 대기중
        REVIEWED,   // 검토완료
        REJECTED    // 반려
    }
}
