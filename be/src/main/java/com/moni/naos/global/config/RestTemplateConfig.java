package com.moni.naos.global.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * RestTemplateConfig - HTTP 클라이언트 설정
 * 
 * Flask AI 서버 호출용
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(10))   // 연결 타임아웃
                .readTimeout(Duration.ofMinutes(10))      // 읽기 타임아웃 (전사는 오래 걸림)
                .build();
    }
}
