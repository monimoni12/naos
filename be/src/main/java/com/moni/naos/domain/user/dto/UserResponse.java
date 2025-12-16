package com.moni.naos.domain.user.dto;

import com.moni.naos.domain.user.entity.User;
import lombok.*;

/**
 * 유저 응답 DTO
 * - 인증 정보 + 프로필 요약
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String role;
    private Boolean active;
    private Boolean emailVerified;

    // Profile 정보 (요약)
    private String username;
    private String fullName;  // ⭐ 성명 (nickname → fullName)
    private String avatarUrl;

    /**
     * Entity → DTO 변환
     */
    public static UserResponse fromEntity(User user) {
        UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().getName().name())
                .active(user.getActive())
                .emailVerified(user.getEmailVerified());

        // Profile 정보 추가
        if (user.getProfile() != null) {
            builder.username(user.getProfile().getUsername())
                    .fullName(user.getProfile().getFullName())  // ⭐ 변경
                    .avatarUrl(user.getProfile().getAvatarUrl());
        }

        return builder.build();
    }
}
