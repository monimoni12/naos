package com.moni.naos.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger(OpenAPI) 설정 클래스
 * - Swagger UI 접속: http://localhost:8090/swagger-ui/index.html
 * - OpenAPI JSON:   http://localhost:8090/v3/api-docs
 */
@Configuration
@RequiredArgsConstructor
public class SwaggerConfig {

    private final SiteProperties siteProperties;

    @Bean
    public OpenAPI naosOpenAPI() {
        // JWT 인증 설정
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        SecurityRequirement securityRequirement = new SecurityRequirement().addList("Bearer Token");

        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(
                        new Server().url(siteProperties.getBackUrl()).description("현재 서버"),
                        new Server().url("http://localhost:8090").description("로컬 서버"),
                        new Server().url("https://api.naossss.site").description("배포 서버")
                ))
                .components(new Components().addSecuritySchemes("Bearer Token", securityScheme))
                .addSecurityItem(securityRequirement);
    }

    private Info apiInfo() {
        return new Info()
                .title("NAOS Recipe API")
                .description("🍳 레시피 업로드, 분석, AI 기반 추천 시스템의 API 문서입니다.")
                .version("v1.0.0")
                .contact(new Contact()
                        .name("NAOS Team")
                        .email("team@naos.app"));
    }
}
