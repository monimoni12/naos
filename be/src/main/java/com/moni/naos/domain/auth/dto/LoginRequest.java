package com.moni.naos.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * 로그인 요청 DTO
 * - 이메일 또는 사용자명(username)으로 로그인 가능
 * - deviceInfo, ipAddress는 서버에서 자동 추출
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    /**
     * 이메일 또는 사용자명 (둘 다 가능)
     * 예: "example@email.com" 또는 "sexytofu"
     */
    @NotBlank(message = "이메일 또는 사용자명을 입력해주세요.")
    private String identifier;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 20, message = "비밀번호는 8~20자여야 합니다.")
    private String password;
}
