package com.moni.naos.global.websocket;

import com.moni.naos.domain.interaction.comment.dto.CommentMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * WebSocket STOMP 메시지 컨트롤러
 * 
 * 클라이언트 사용법:
 * 1. 연결: new SockJS('/ws')
 * 2. 구독: stompClient.subscribe('/topic/recipes/123/comments', callback)
 * 3. 발행: stompClient.send('/app/recipes/123/comments', {}, JSON.stringify(message))
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketMessageController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisPublisher redisPublisher;

    /**
     * 댓글 메시지 수신 → Redis 발행 → 모든 구독자에게 브로드캐스트
     * 
     * 클라이언트: /app/recipes/{recipeId}/comments 로 발행
     * 구독자: /topic/recipes/{recipeId}/comments 로 수신
     */
    @MessageMapping("/recipes/{recipeId}/comments")
    public void handleComment(
            @DestinationVariable Long recipeId,
            CommentMessage message
    ) {
        log.info("댓글 메시지 수신: recipeId={}, message={}", recipeId, message);

        // Redis로 발행 (다중 서버 동기화)
        redisPublisher.publishComment(recipeId, message);
    }

    /**
     * 좋아요 메시지 수신 → Redis 발행
     */
    @MessageMapping("/recipes/{recipeId}/likes")
    public void handleLike(
            @DestinationVariable Long recipeId,
            LikeMessage message
    ) {
        log.info("좋아요 메시지 수신: recipeId={}, message={}", recipeId, message);

        // Redis로 발행
        redisPublisher.publishLike(recipeId, message);
    }

    /**
     * 직접 브로드캐스트 (Redis 거치지 않고)
     * - 단일 서버 환경에서 사용
     */
    public void broadcastComment(Long recipeId, CommentMessage message) {
        String destination = "/topic/recipes/" + recipeId + "/comments";
        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * 특정 유저에게 알림 전송
     */
    public void sendNotification(Long userId, Object notification) {
        String destination = "/user/" + userId + "/notifications";
        messagingTemplate.convertAndSend(destination, notification);
    }

    // ==================== 메시지 DTO ====================

    /**
     * 좋아요 메시지 DTO
     */
    public record LikeMessage(
            Long recipeId,
            Long userId,
            boolean liked,
            long count,
            String type  // LIKED, UNLIKED
    ) {}
}
