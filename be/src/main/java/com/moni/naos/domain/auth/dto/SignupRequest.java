package com.moni.naos.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * 회원가입 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 20, message = "비밀번호는 8~20자여야 합니다.")
    private String password;

    @NotBlank(message = "사용자명은 필수입니다.")
    @Size(min = 3, max = 20, message = "사용자명은 3~20자여야 합니다.")
    @Pattern(regexp = "^[a-zA-Z0-9_.]+$", message = "사용자명은 영문, 숫자, 밑줄, 마침표만 사용 가능합니다.")
    private String username;

    /** 성명 (인스타 full_name) - 선택, 없으면 username 사용 */
    @Size(max = 50, message = "성명은 50자 이하여야 합니다.")
    private String fullName;

    /** 생년월일 (선택) */
    private LocalDate birthDate;
}
