package com.moni.naos.domain.user.repository;

import com.moni.naos.domain.user.entity.Profile;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * ProfileRepository
 * - 사용자 프로필 CRUD
 * - 닉네임, 소개, 아바타, 포인트 캐시 관리
 */
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUser(User user);
}
