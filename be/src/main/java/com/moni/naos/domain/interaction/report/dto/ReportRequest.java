package com.moni.naos.domain.interaction.report.dto;

import lombok.*;

/** 신고 등록 요청 DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportRequest {
    private String targetType; // RECIPE / COMMENT / USER
    private Long targetId;
    private String reasonCode; // SPAM/HATE/NUDITY/ETC
    private String detail;     // 상세 설명(선택)
}
