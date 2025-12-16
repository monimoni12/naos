package com.moni.naos.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 에러 코드 정의
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ==================== 공통 ====================
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C002", "서버 오류가 발생했습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "C003", "리소스를 찾을 수 없습니다."),

    // ==================== 인증 ====================
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "A001", "인증이 필요합니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A002", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "만료된 토큰입니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "A004", "접근 권한이 없습니다."),

    // ==================== 회원 ====================
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "유저를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "U002", "이미 사용 중인 이메일입니다."),
    DUPLICATE_USERNAME(HttpStatus.CONFLICT, "U003", "이미 사용 중인 사용자명입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "U004", "비밀번호가 일치하지 않습니다."),
    PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "U005", "프로필을 찾을 수 없습니다."),

    // ==================== 레시피 ====================
    RECIPE_NOT_FOUND(HttpStatus.NOT_FOUND, "R001", "레시피를 찾을 수 없습니다."),
    RECIPE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "R002", "레시피에 접근할 수 없습니다."),
    RECIPE_ALREADY_PUBLISHED(HttpStatus.BAD_REQUEST, "R003", "이미 발행된 레시피입니다."),

    // ==================== 댓글 ====================
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "CM001", "댓글을 찾을 수 없습니다."),
    COMMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "CM002", "댓글에 접근할 수 없습니다."),

    // ==================== 팔로우 ====================
    CANNOT_FOLLOW_SELF(HttpStatus.BAD_REQUEST, "F001", "자기 자신을 팔로우할 수 없습니다."),
    ALREADY_FOLLOWING(HttpStatus.CONFLICT, "F002", "이미 팔로우 중입니다."),

    // ==================== 신고 ====================
    ALREADY_REPORTED(HttpStatus.CONFLICT, "RP001", "이미 신고한 대상입니다."),
    CANNOT_REPORT_SELF(HttpStatus.BAD_REQUEST, "RP002", "자기 자신을 신고할 수 없습니다."),

    // ==================== 파일 ====================
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "FL001", "파일 업로드에 실패했습니다."),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "FL002", "지원하지 않는 파일 형식입니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "FL003", "파일 크기가 초과되었습니다."),

    // ==================== AI ====================
    AI_SERVER_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "AI001", "AI 서버 오류가 발생했습니다."),
    STT_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI002", "음성 인식에 실패했습니다."),
    COST_ANALYSIS_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI003", "가성비 분석에 실패했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
