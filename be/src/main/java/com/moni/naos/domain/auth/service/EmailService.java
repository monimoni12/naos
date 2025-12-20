package com.moni.naos.domain.auth.service;

/**
 * EmailService 인터페이스
 * - prod: 실제 이메일 발송 (RealEmailService)
 * - dev: 콘솔 로그 출력 (MockEmailService)
 */
public interface EmailService {
    
    /**
     * 인증 코드 이메일 발송
     */
    void sendVerificationCode(String to, String code);
}
