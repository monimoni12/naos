package com.moni.naos.global.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Redis Pub/Sub Subscriber
 * - Redis 채널 구독
 * - 메시지 수신 시 WebSocket으로 브로드캐스트
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String body = new String(message.getBody());

            log.debug("Redis 수신: channel={}, body={}", channel, body);

            // 채널에서 정보 추출
            // 형식: naos:recipe:{recipeId}:comments
            String[] parts = channel.split(":");

            if (parts.length >= 4) {
                String type = parts[1];  // recipe 또는 user
                String id = parts[2];    // recipeId 또는 userId
                String event = parts[3]; // comments, likes, notifications

                if ("recipe".equals(type)) {
                    // 레시피 관련 이벤트
                    String destination = "/topic/recipes/" + id + "/" + event;
                    messagingTemplate.convertAndSend(destination, body);
                    log.debug("WebSocket 전송: destination={}", destination);
                } else if ("user".equals(type)) {
                    // 특정 유저에게 알림
                    String destination = "/user/" + id + "/notifications";
                    messagingTemplate.convertAndSend(destination, body);
                    log.debug("WebSocket 전송: destination={}", destination);
                }
            }

        } catch (Exception e) {
            log.error("Redis 메시지 처리 실패", e);
        }
    }
}
