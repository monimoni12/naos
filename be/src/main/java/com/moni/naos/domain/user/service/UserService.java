package com.moni.naos.domain.user.service;

import com.moni.naos.domain.user.dto.UserResponse;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UserService - 유저 관련 비즈니스 로직
 * - 유저 조회 (인증 정보)
 * - 계정 관리 (활성화/비활성화)
 * - 이메일 인증 처리
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /**
     * ID로 유저 조회
     */
    public UserResponse getUserById(Long id) {
        User user = userRepository.findByIdWithProfile(id)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + id));

        return UserResponse.fromEntity(user);
    }

    /**
     * 이메일로 유저 조회
     */
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmailWithProfile(email)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + email));

        return UserResponse.fromEntity(user);
    }

    /**
     * 이메일 존재 여부 확인
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * 계정 비활성화
     */
    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + id));

        user.setActive(false);
        userRepository.save(user);
    }

    /**
     * 계정 활성화
     */
    @Transactional
    public void activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + id));

        user.setActive(true);
        userRepository.save(user);
    }

    /**
     * 이메일 인증 완료 처리
     */
    @Transactional
    public void verifyEmail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + userId));

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    /**
     * 비밀번호 변경
     */
    @Transactional
    public void changePassword(Long userId, String encodedPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + userId));

        user.setPasswordHash(encodedPassword);
        userRepository.save(user);
    }

    /**
     * 관리자 권한 확인
     */
    public boolean isAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다: " + userId));

        return user.getRole().getName().name().equals("ROLE_ADMIN");
    }
}
