package com.moni.naos.domain.interaction.comment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 댓글 생성/수정 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentCreateRequest {

    @NotBlank(message = "댓글 내용을 입력해주세요.")
    private String content;

    private Long parentId;   // 대댓글이면 부모 댓글 ID
}
