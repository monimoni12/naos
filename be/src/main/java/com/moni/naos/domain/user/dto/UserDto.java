package com.moni.naos.domain.user.dto;

import lombok.*;

/** 사용자 요약 DTO (관리/리스트 용) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDto {
    private Long id;
    private String email;
    private String role;
}
