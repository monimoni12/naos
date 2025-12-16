package com.moni.naos.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 외부 서비스 엔드포인트 설정
 * - Flask AI 서버 (Whisper STT, GPT 가성비 분석)
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai.server")
public class ExternalEndpointProperties {

    /** AI 서버 URL */
    private String url = "http://localhost:5000";

    /** 요청 타임아웃 (ms) */
    private int timeout = 30000;

    // ==================== 엔드포인트 경로 ====================

    /** Whisper STT 엔드포인트 */
    public String getWhisperEndpoint() {
        return url + "/api/whisper/transcribe";
    }

    /** 가성비 분석 엔드포인트 */
    public String getCostAnalysisEndpoint() {
        return url + "/api/gpt/cost-analysis";
    }

    /** 건강 체크 엔드포인트 */
    public String getHealthEndpoint() {
        return url + "/health";
    }
}
