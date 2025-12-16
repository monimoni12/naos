package com.moni.naos.global.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * 에러 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    /** HTTP 상태 코드 */
    private int status;

    /** 에러 코드 */
    private String code;

    /** 에러 메시지 */
    private String message;

    /** 상세 에러 (Validation 등) */
    private Map<String, String> errors;

    /** 발생 시간 */
    private Instant timestamp;
}
