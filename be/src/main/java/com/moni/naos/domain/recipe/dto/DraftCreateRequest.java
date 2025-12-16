package com.moni.naos.domain.recipe.dto;

import lombok.*;

/**
 * Draft(임시 레시피) 생성 요청 DTO
 * - 영상 업로드 직후 최소한의 정보만 받음
 * - 나머지는 saveDetails에서 입력
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DraftCreateRequest {

    /**
     * 레시피 제목 (선택)
     * - 비워두면 "임시 저장"으로 설정
     */
    private String title;

    /**
     * 영상 URL (선택)
     * - S3 업로드 완료 후 받은 URL
     */
    private String videoUrl;
}
