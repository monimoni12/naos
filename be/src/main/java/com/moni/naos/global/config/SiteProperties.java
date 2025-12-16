package com.moni.naos.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 사이트 설정 Properties
 * - application.yml의 custom.site 바인딩
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "custom.site")
public class SiteProperties {

    /** 사이트 이름 */
    private String name;

    /** 쿠키 도메인 */
    private String cookieDomain;

    /** 프론트엔드 URL */
    private String frontUrl;

    /** 백엔드 URL */
    private String backUrl;

    /** 쿠키 설정 */
    private Cookie cookie = new Cookie();

    @Getter
    @Setter
    public static class Cookie {
        /** HTTPS에서만 쿠키 전송 */
        private boolean secure = false;

        /** SameSite 설정 (Lax, Strict, None) */
        private String sameSite = "Lax";
    }
}
