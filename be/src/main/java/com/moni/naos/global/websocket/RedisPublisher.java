package com.moni.naos.global.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Redis Pub/Sub Publisher
 * - 메시지를 Redis 채널에 발행
 * - 다중 서버 환경에서 동기화용
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisPublisher {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    /** Redis 채널 prefix */
    private static final String CHANNEL_PREFIX = "naos:";

    /**
     * 댓글 메시지 발행
     * @param recipeId 레시피 ID
     * @param message 메시지 객체
     */
    public void publishComment(Long recipeId, Object message) {
        String channel = CHANNEL_PREFIX + "recipe:" + recipeId + ":comments";
        publish(channel, message);
    }

    /**
     * 좋아요 메시지 발행
     * @param recipeId 레시피 ID
     * @param message 메시지 객체
     */
    public void publishLike(Long recipeId, Object message) {
        String channel = CHANNEL_PREFIX + "recipe:" + recipeId + ":likes";
        publish(channel, message);
    }

    /**
     * 알림 메시지 발행 (특정 유저)
     * @param userId 유저 ID
     * @param message 메시지 객체
     */
    public void publishNotification(Long userId, Object message) {
        String channel = CHANNEL_PREFIX + "user:" + userId + ":notifications";
        publish(channel, message);
    }

    /**
     * 공통 발행 메서드
     */
    private void publish(String channel, Object message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            redisTemplate.convertAndSend(channel, json);
            log.debug("Redis 발행: channel={}, message={}", channel, json);
        } catch (JsonProcessingException e) {
            log.error("Redis 발행 실패: channel={}", channel, e);
        }
    }
}
