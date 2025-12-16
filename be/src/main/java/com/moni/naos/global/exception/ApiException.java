package com.moni.naos.global.exception;

import lombok.Getter;

/**
 * API 커스텀 예외
 * 
 * 사용법:
 * throw new ApiException(ErrorCode.USER_NOT_FOUND);
 * throw new ApiException(ErrorCode.INVALID_INPUT, "이메일 형식이 올바르지 않습니다.");
 */
@Getter
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public ApiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ApiException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }
}
