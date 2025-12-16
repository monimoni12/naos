package com.moni.naos.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 설정
 * - CORS는 SecurityConfig에서 관리
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // CORS 설정은 SecurityConfig.corsConfigurationSource()에서 관리
    // 여기에 추가 WebMvc 설정이 필요하면 작성

}
