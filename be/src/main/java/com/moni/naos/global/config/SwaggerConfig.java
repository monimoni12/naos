package com.moni.naos.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger(OpenAPI) 설정 클래스
 * - Swagger UI 접속: http://localhost:8090/swagger-ui/index.html
 * - OpenAPI JSON:   http://localhost:8090/v3/api-docs
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI naosOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("NAOS Recipe API")
                        .description("🍳레시피 업로드, 분석, AI 기반 추천 시스템의 API 문서입니다.")
                        .version("v1.0.0"))
                .servers(List.of(
                        new Server().url("http://localhost:8090").description("로컬 서버"),
                        new Server().url("https://naos-demo.site").description("배포 서버")
                ));
    }
}
