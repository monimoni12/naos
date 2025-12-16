package com.moni.naos.domain.interaction.report.controller;

import com.moni.naos.domain.interaction.report.dto.ReportRequest;
import com.moni.naos.domain.interaction.report.dto.ReportResponse;
import com.moni.naos.domain.interaction.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * ReportController - 신고 API
 */
@Tag(name = "Report", description = "신고 API")
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "레시피 신고")
    @PostMapping("/recipes/{recipeId}")
    public ResponseEntity<ReportResponse> reportRecipe(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId,
            @Valid @RequestBody ReportRequest request
    ) {
        ReportResponse response = reportService.reportRecipe(userId, recipeId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "댓글 신고")
    @PostMapping("/comments/{commentId}")
    public ResponseEntity<ReportResponse> reportComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId,
            @Valid @RequestBody ReportRequest request
    ) {
        ReportResponse response = reportService.reportComment(userId, commentId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "유저 신고")
    @PostMapping("/users/{targetUserId}")
    public ResponseEntity<ReportResponse> reportUser(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long targetUserId,
            @Valid @RequestBody ReportRequest request
    ) {
        ReportResponse response = reportService.reportUser(userId, targetUserId, request);
        return ResponseEntity.ok(response);
    }
}
