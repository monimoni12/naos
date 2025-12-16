package com.moni.naos.global.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * STOMP 메시지 인터셉터
 * - 연결 시 JWT 인증 (선택)
 * - 로깅
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StompChannelInterceptor implements ChannelInterceptor {

    // private final JwtTokenProvider jwtTokenProvider;  // 필요 시 주입

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            StompCommand command = accessor.getCommand();

            if (StompCommand.CONNECT.equals(command)) {
                // 연결 시 처리
                String sessionId = accessor.getSessionId();
                log.info("WebSocket 연결: sessionId={}", sessionId);

                // JWT 인증 (선택 - 주석 해제하여 사용)
                // String token = accessor.getFirstNativeHeader("Authorization");
                // if (token != null && token.startsWith("Bearer ")) {
                //     String jwt = token.substring(7);
                //     Long userId = jwtTokenProvider.getUserId(jwt);
                //     accessor.setUser(new StompPrincipal(userId));
                // }
            }

            if (StompCommand.SUBSCRIBE.equals(command)) {
                String destination = accessor.getDestination();
                log.debug("WebSocket 구독: destination={}", destination);
            }

            if (StompCommand.DISCONNECT.equals(command)) {
                String sessionId = accessor.getSessionId();
                log.info("WebSocket 연결 해제: sessionId={}", sessionId);
            }
        }

        return message;
    }
}
