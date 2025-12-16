package com.moni.naos.domain.recipe.dto;

import lombok.*;

/**
 * 비디오/썸네일 등 자산 등록 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetRequest {

    private String type;   // VIDEO / THUMB
    private String url;    // 업로드된 파일의 접근 URL
}
