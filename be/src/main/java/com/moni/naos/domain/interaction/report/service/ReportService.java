package com.moni.naos.domain.interaction.report.service;

import com.moni.naos.domain.interaction.comment.entity.Comment;
import com.moni.naos.domain.interaction.comment.repository.CommentRepository;
import com.moni.naos.domain.interaction.report.dto.ReportRequest;
import com.moni.naos.domain.interaction.report.dto.ReportResponse;
import com.moni.naos.domain.interaction.report.entity.Report;
import com.moni.naos.domain.interaction.report.repository.ReportRepository;
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

/**
 * ReportService - 신고 비즈니스 로직
 * - Redis Pub/Sub으로 관리자 알림
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final CommentRepository commentRepository;
    private final RedisPublisher redisPublisher;

    private static final Long ADMIN_CHANNEL_ID = 0L;

    @Transactional
    public ReportResponse reportRecipe(Long userId, Long recipeId, ReportRequest request) {
        User reporter = getUser(userId);
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        if (recipe.getAuthor() != null && recipe.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 게시물은 신고할 수 없습니다.");
        }

        checkDuplicateReport(reporter, Report.TargetType.RECIPE, recipeId);
        Report saved = reportRepository.save(createReport(reporter, Report.TargetType.RECIPE, recipeId, request));
        log.info("레시피 신고: reportId={}, recipeId={}", saved.getId(), recipeId);

        broadcastReport(saved, "RECIPE", recipe.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public ReportResponse reportComment(Long userId, Long commentId, ReportRequest request) {
        User reporter = getUser(userId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 댓글은 신고할 수 없습니다.");
        }

        checkDuplicateReport(reporter, Report.TargetType.COMMENT, commentId);
        Report saved = reportRepository.save(createReport(reporter, Report.TargetType.COMMENT, commentId, request));
        log.info("댓글 신고: reportId={}, commentId={}", saved.getId(), commentId);

        broadcastReport(saved, "COMMENT", comment.getText());
        return toResponse(saved);
    }

    @Transactional
    public ReportResponse reportUser(Long userId, Long targetUserId, ReportRequest request) {
        User reporter = getUser(userId);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("본인을 신고할 수 없습니다.");
        }

        checkDuplicateReport(reporter, Report.TargetType.USER, targetUserId);
        Report saved = reportRepository.save(createReport(reporter, Report.TargetType.USER, targetUserId, request));

        String targetName = targetUser.getProfile() != null ? targetUser.getProfile().getFullName() : "Unknown";  // ⭐ 변경
        log.info("유저 신고: reportId={}, targetUserId={}", saved.getId(), targetUserId);

        broadcastReport(saved, "USER", targetName);
        return toResponse(saved);
    }

    public long getReportCount(Report.TargetType targetType, Long targetId) {
        return reportRepository.countByTargetTypeAndTargetId(targetType, targetId);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
    }

    private void checkDuplicateReport(User reporter, Report.TargetType targetType, Long targetId) {
        if (reportRepository.existsByReporterAndTargetTypeAndTargetId(reporter, targetType, targetId)) {
            throw new IllegalArgumentException("이미 신고한 대상입니다.");
        }
    }

    private Report createReport(User reporter, Report.TargetType targetType, Long targetId, ReportRequest request) {
        return Report.builder()
                .reporter(reporter)
                .targetType(targetType)
                .targetId(targetId)
                .reason(request.getReasonCode())
                .detail(request.getDetail())
                .status(Report.Status.PENDING)
                .build();
    }

    private ReportResponse toResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .targetType(report.getTargetType().name())
                .targetId(report.getTargetId())
                .reasonCode(report.getReason())  // ✅ 이미 String
                .status(report.getStatus().name())
                .createdAt(report.getCreatedAt())
                .build();
    }

    private void broadcastReport(Report report, String targetTypeName, String targetPreview) {
        ReportNotification notification = new ReportNotification(
                report.getId(), 
                report.getReporter().getId(), 
                targetTypeName,
                report.getTargetId(), 
                targetPreview, 
                report.getReason(),  // ✅ .name() 제거
                report.getDetail(), 
                Instant.now(), 
                "NEW_REPORT"
        );
        redisPublisher.publishNotification(ADMIN_CHANNEL_ID, notification);
    }

    public record ReportNotification(
            Long reportId, Long reporterId, String targetType, Long targetId,
            String targetPreview, String reasonCode, String detail, Instant createdAt, String type
    ) {}
}
