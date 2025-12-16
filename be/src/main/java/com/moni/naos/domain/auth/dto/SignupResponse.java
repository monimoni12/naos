package com.moni.naos.domain.auth.dto;

import lombok.*;

/**
 * 회원가입 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupResponse {

    private Long userId;
    private String email;
    private String username;
    private String fullName;
    private String message;
}
