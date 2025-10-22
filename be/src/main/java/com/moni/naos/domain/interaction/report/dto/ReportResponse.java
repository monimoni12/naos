package com.moni.naos.domain.interaction.report.dto;

import lombok.*;
import java.time.Instant;

/** 신고 접수 결과/조회 응답 DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportResponse {
    private Long id;
    private String targetType;
    private Long targetId;
    private String reasonCode;
    private String status;        // RECEIVED/REVIEWING/RESOLVED
    private Instant createdAt;
}
