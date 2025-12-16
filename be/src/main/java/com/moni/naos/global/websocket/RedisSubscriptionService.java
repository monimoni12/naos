package com.moni.naos.global.websocket;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Service;

/**
 * Redis 채널 구독 관리 서비스
 * - 패턴 기반 구독으로 모든 레시피/유저 채널 수신
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisSubscriptionService {

    private final RedisMessageListenerContainer listenerContainer;
    private final RedisSubscriber redisSubscriber;

    @PostConstruct
    public void init() {
        // 패턴 구독: 모든 레시피 댓글
        subscribePattern("naos:recipe:*:comments");

        // 패턴 구독: 모든 레시피 좋아요
        subscribePattern("naos:recipe:*:likes");

        // 패턴 구독: 모든 유저 알림
        subscribePattern("naos:user:*:notifications");

        log.info("Redis Pub/Sub 구독 시작");
    }

    /**
     * 패턴 기반 구독
     */
    public void subscribePattern(String pattern) {
        listenerContainer.addMessageListener(redisSubscriber, new PatternTopic(pattern));
        log.debug("Redis 패턴 구독: {}", pattern);
    }

    /**
     * 특정 채널 구독
     */
    public void subscribe(String channel) {
        listenerContainer.addMessageListener(redisSubscriber, new ChannelTopic(channel));
        log.debug("Redis 채널 구독: {}", channel);
    }

    /**
     * 채널 구독 해제
     */
    public void unsubscribe(String channel) {
        listenerContainer.removeMessageListener(redisSubscriber, new ChannelTopic(channel));
        log.debug("Redis 채널 구독 해제: {}", channel);
    }
}
