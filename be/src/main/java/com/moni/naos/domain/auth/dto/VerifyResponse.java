package com.moni.naos.domain.auth.dto;

import lombok.*;

/**
 * 인증 확인 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyResponse {
    
    /** 인증 성공 여부 */
    private boolean verified;
    
    /** 메시지 */
    private String message;
}
