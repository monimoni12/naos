package com.moni.naos.domain.user.service;

import com.moni.naos.domain.user.dto.ProfileResponse;
import com.moni.naos.domain.user.dto.ProfileUpdateRequest;
import com.moni.naos.domain.user.entity.Profile;
import com.moni.naos.domain.user.repository.ProfileRepository;
import com.moni.naos.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ProfileService - 프로필 관련 비즈니스 로직
 * - 프로필 조회 (username으로)
 * - 프로필 수정
 * - 포인트 관리
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    /**
     * username으로 프로필 조회 (공개 프로필)
     * - /user/{username} 라우팅용
     */
    public ProfileResponse getProfileByUsername(String username) {
        Profile profile = profileRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다: " + username));

        // 비공개 프로필 체크 (추후 확장)
        if (!profile.getIsPublic()) {
            // 현재는 간단히 처리, 추후 팔로워만 볼 수 있도록 확장 가능
        }

        return ProfileResponse.fromEntity(profile);
    }

    /**
     * User ID로 프로필 조회 (본인 프로필)
     */
    public ProfileResponse getProfileByUserId(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다."));

        return ProfileResponse.fromEntity(profile);
    }

    /**
     * 프로필 수정
     * - 본인만 수정 가능 (Controller에서 권한 체크)
     */
    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다."));

        // username 변경 시 중복 체크
        if (request.getUsername() != null && !request.getUsername().equals(profile.getUsername())) {
            if (profileRepository.existsByUsername(request.getUsername())) {
                throw new IllegalArgumentException("이미 사용 중인 사용자명입니다.");
            }
            profile.setUsername(request.getUsername());
        }

        // 나머지 필드 업데이트
        if (request.getFullName() != null) {  // ⭐ 변경
            profile.setFullName(request.getFullName());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getWebsite() != null) {
            profile.setWebsite(request.getWebsite());
        }
        if (request.getLocation() != null) {
            profile.setLocation(request.getLocation());
        }
        if (request.getIsPublic() != null) {
            profile.setIsPublic(request.getIsPublic());
        }

        Profile saved = profileRepository.save(profile);
        return ProfileResponse.fromEntity(saved);
    }

    /**
     * 포인트 추가
     */
    @Transactional
    public void addPoints(Long userId, int amount) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다."));

        profile.addPoints(amount);
        profileRepository.save(profile);
    }

    /**
     * 포인트 차감
     */
    @Transactional
    public void deductPoints(Long userId, int amount) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다."));

        profile.deductPoints(amount);
        profileRepository.save(profile);
    }

    /**
     * 현재 포인트 조회
     */
    public int getPoints(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필을 찾을 수 없습니다."));

        return profile.getPoints();
    }
}
