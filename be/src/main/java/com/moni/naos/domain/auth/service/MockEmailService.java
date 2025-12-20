package com.moni.naos.domain.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * MockEmailService - 콘솔 로그 출력 (개발 환경)
 * 로컬에서 테스트할 때 실제 이메일 대신 콘솔에 코드 출력
 */
@Slf4j
@Service
@Profile("!prod")
public class MockEmailService implements EmailService {

    @Override
    public void sendVerificationCode(String to, String code) {
        log.info("========================================");
        log.info("📧 [개발 환경] 인증 코드 발송");
        log.info("   To: {}", to);
        log.info("   Code: {}", code);
        log.info("   (실제 이메일은 발송되지 않습니다)");
        log.info("========================================");
    }
}
