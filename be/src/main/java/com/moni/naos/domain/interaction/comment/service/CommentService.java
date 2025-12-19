package com.moni.naos.domain.interaction.comment.service;

import com.moni.naos.domain.interaction.comment.dto.CommentCreateRequest;
import com.moni.naos.domain.interaction.comment.dto.CommentMessage;
import com.moni.naos.domain.interaction.comment.dto.CommentResponse;
import com.moni.naos.domain.interaction.comment.entity.Comment;
import com.moni.naos.domain.interaction.comment.entity.CommentLike;
import com.moni.naos.domain.interaction.comment.repository.CommentLikeRepository;
import com.moni.naos.domain.interaction.comment.repository.CommentRepository;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.UserRepository;
import com.moni.naos.global.websocket.RedisPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CommentService - 댓글 비즈니스 로직
 * - Redis Pub/Sub으로 실시간 브로드캐스트
 * 
 * ⭐ 수정: 부모 댓글 삭제 시 대댓글도 함께 삭제 (Cascade Soft Delete)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final RedisPublisher redisPublisher;

    @Transactional
    public CommentResponse create(Long userId, Long recipeId, CommentCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = Comment.builder()
                .user(user)
                .recipe(recipe)
                .parent(parent)
                .text(request.getContent())
                .build();

        Comment saved = commentRepository.save(comment);
        log.info("댓글 작성: commentId={}, userId={}, recipeId={}", saved.getId(), userId, recipeId);

        broadcastComment(saved, recipeId, "CREATED");
        return CommentResponse.fromEntity(saved, 0, false);
    }

    public List<CommentResponse> getByRecipe(Long recipeId, Long currentUserId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        User currentUser = currentUserId != null
                ? userRepository.findById(currentUserId).orElse(null) : null;

        List<Comment> rootComments = commentRepository.findByRecipeAndParentIsNullOrderByCreatedAtAsc(recipe);

        return rootComments.stream()
                .filter(c -> c.getDeletedAt() == null)
                .map(comment -> {
                    CommentResponse response = toResponseWithLikes(comment, currentUser);
                    List<CommentResponse> replies = commentRepository.findByParentOrderByCreatedAtAsc(comment)
                            .stream()
                            .filter(r -> r.getDeletedAt() == null)
                            .map(reply -> toResponseWithLikes(reply, currentUser))
                            .collect(Collectors.toList());
                    response.setReplies(replies);
                    return response;
                })
                .collect(Collectors.toList());
    }

    public List<CommentResponse> getByRecipe(Long recipeId) {
        return getByRecipe(recipeId, null);
    }

    @Transactional
    public CommentResponse update(Long userId, Long commentId, CommentCreateRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 댓글만 수정할 수 있습니다.");
        }

        comment.setText(request.getContent());
        Comment saved = commentRepository.save(comment);
        User currentUser = userRepository.findById(userId).orElse(null);
        log.info("댓글 수정: commentId={}", commentId);

        broadcastComment(saved, saved.getRecipe().getId(), "UPDATED");
        return toResponseWithLikes(saved, currentUser);
    }

    @Transactional
    public void delete(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 댓글만 삭제할 수 있습니다.");
        }

        Long recipeId = comment.getRecipe().getId();
        
        // ⭐ 대댓글(자식 댓글)도 함께 삭제 (Cascade Soft Delete)
        List<Comment> children = commentRepository.findByParentOrderByCreatedAtAsc(comment);
        for (Comment child : children) {
            if (child.getDeletedAt() == null) {  // 아직 삭제되지 않은 것만
                child.setDeletedAt(Instant.now());
                child.setText("삭제된 댓글입니다.");
                commentRepository.save(child);
                log.info("대댓글 삭제: commentId={}", child.getId());
            }
        }
        
        // 부모 댓글 삭제
        comment.setDeletedAt(Instant.now());
        comment.setText("삭제된 댓글입니다.");
        commentRepository.save(comment);
        log.info("댓글 삭제: commentId={}", commentId);

        broadcastComment(comment, recipeId, "DELETED");
    }

    @Transactional
    public boolean toggleLike(Long userId, Long commentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        boolean liked;
        if (commentLikeRepository.existsByUserAndComment(user, comment)) {
            commentLikeRepository.deleteByUserAndComment(user, comment);
            log.info("댓글 좋아요 취소: userId={}, commentId={}", userId, commentId);
            liked = false;
        } else {
            CommentLike like = CommentLike.builder()
                    .user(user)
                    .comment(comment)
                    .createdAt(Instant.now())
                    .build();
            commentLikeRepository.save(like);
            log.info("댓글 좋아요: userId={}, commentId={}", userId, commentId);
            liked = true;
        }

        broadcastComment(comment, comment.getRecipe().getId(), liked ? "LIKED" : "UNLIKED");
        return liked;
    }

    public long getLikeCount(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        return commentLikeRepository.countByComment(comment);
    }

    public long getCommentCount(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        return commentRepository.countByRecipeAndNotDeleted(recipe);
    }

    private CommentResponse toResponseWithLikes(Comment comment, User currentUser) {
        long likeCount = commentLikeRepository.countByComment(comment);
        boolean liked = currentUser != null &&
                commentLikeRepository.existsByUserAndComment(currentUser, comment);
        return CommentResponse.fromEntity(comment, likeCount, liked);
    }

    private void broadcastComment(Comment comment, Long recipeId, String type) {
        String authorName = null, authorUsername = null, authorProfileUrl = null;
        if (comment.getUser() != null && comment.getUser().getProfile() != null) {
            authorName = comment.getUser().getProfile().getFullName();
            authorUsername = comment.getUser().getProfile().getUsername();
            authorProfileUrl = comment.getUser().getProfile().getAvatarUrl();
        }

        CommentMessage message = CommentMessage.builder()
                .id(comment.getId())
                .recipeId(recipeId)
                .authorId(comment.getUser().getId())
                .authorName(authorName)
                .authorUsername(authorUsername)
                .authorProfileUrl(authorProfileUrl)
                .content(comment.getText())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .createdAt(comment.getCreatedAt())
                .type(type)
                .build();

        redisPublisher.publishComment(recipeId, message);
    }
}
