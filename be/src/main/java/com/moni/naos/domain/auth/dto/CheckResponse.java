package com.moni.naos.domain.auth.dto;

import lombok.*;

/**
 * 중복 체크 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckResponse {
    
    /** 사용 가능 여부 */
    private boolean available;
    
    /** 메시지 */
    private String message;
}
