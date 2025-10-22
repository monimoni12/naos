package com.moni.naos.domain.ai.dto;

import lombok.*;

/** AI 작업 상태/결과 응답 DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiJobResponse {
    private Long jobId;
    private String status;     // QUEUED/RUNNING/DONE/FAILED
    private String resultRef;  // 결과 레퍼런스(파일/레코드 키 등)
}
