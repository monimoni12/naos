package com.moni.naos.global.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket + STOMP 설정
 *
 * 클라이언트 연결:
 * - 엔드포인트: /ws
 * - 구독: /topic/recipes/{recipeId}/comments
 * - 발행: /app/recipes/{recipeId}/comments
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompChannelInterceptor stompChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 구독하는 prefix
        // /topic/recipes/123/comments 형태로 구독
        registry.enableSimpleBroker("/topic", "/queue");

        // 클라이언트가 메시지 보내는 prefix
        // /app/recipes/123/comments 형태로 발행
        registry.setApplicationDestinationPrefixes("/app");

        // 특정 사용자에게 메시지 보낼 때 prefix
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")  // CORS 허용
                .withSockJS();  // SockJS 폴백 지원
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // JWT 인증 인터셉터 등록
        registration.interceptors(stompChannelInterceptor);
    }
}
