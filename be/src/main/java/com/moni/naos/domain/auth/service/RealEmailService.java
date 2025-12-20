package com.moni.naos.domain.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * RealEmailService - 실제 이메일 발송 (운영 환경)
 */
@Slf4j
@Service
@Profile("prod")
@RequiredArgsConstructor
public class RealEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendVerificationCode(String to, String code) {
        String subject = "[NAOS] 이메일 인증 코드";
        String content = buildVerificationEmailContent(code);
        
        sendEmail(to, subject, content);
    }

    private void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("ilovemamegoma@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            
            mailSender.send(message);
            log.info("✅ 이메일 발송 성공: to={}", to);
            
        } catch (MessagingException e) {
            log.error("❌ 이메일 발송 실패: to={}, error={}", to, e.getMessage());
            throw new RuntimeException("이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    private String buildVerificationEmailContent(String code) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .logo { font-size: 32px; font-weight: bold; color: #8B7355; text-align: center; }
                    .title { font-size: 24px; font-weight: bold; margin: 30px 0 10px; text-align: center; }
                    .description { color: #666; text-align: center; margin-bottom: 30px; }
                    .code-box { 
                        background: #F5F5F5; 
                        border-radius: 12px; 
                        padding: 30px; 
                        text-align: center;
                        margin: 20px 0;
                    }
                    .code { 
                        font-size: 36px; 
                        font-weight: bold; 
                        letter-spacing: 8px; 
                        color: #8B7355;
                    }
                    .expire { color: #999; font-size: 14px; margin-top: 15px; }
                    .footer { color: #999; font-size: 12px; text-align: center; margin-top: 40px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">🐟 NAOS</div>
                    <div class="title">이메일 인증</div>
                    <div class="description">아래 인증 코드를 입력해주세요.</div>
                    <div class="code-box">
                        <div class="code">%s</div>
                        <div class="expire">이 코드는 5분간 유효합니다.</div>
                    </div>
                    <div class="footer">
                        본 메일은 NAOS 회원가입을 위해 발송되었습니다.<br>
                        본인이 요청하지 않은 경우 이 메일을 무시해주세요.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(code);
    }
}
