package com.moni.naos.domain.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * 프로필 수정 요청 DTO
 * - 모든 필드 선택 (null이면 변경 안함)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {

    @Size(min = 3, max = 20, message = "사용자명은 3~20자여야 합니다.")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "사용자명은 영문, 숫자, 밑줄만 사용 가능합니다.")
    private String username;

    @Size(max = 50, message = "성명은 50자 이하여야 합니다.")
    private String fullName;  // ⭐ 성명 (nickname → fullName)

    @Size(max = 512, message = "이미지 URL은 512자 이하여야 합니다.")
    private String avatarUrl;

    @Size(max = 500, message = "소개는 500자 이하여야 합니다.")
    private String bio;

    @Size(max = 512, message = "웹사이트 URL은 512자 이하여야 합니다.")
    private String website;

    @Size(max = 120, message = "위치는 120자 이하여야 합니다.")
    private String location;

    private Boolean isPublic;
}
