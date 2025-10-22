package com.moni.naos.domain.user.repository;

import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * UserRepository
 * - 사용자 인증/조회용 Repository
 * - 이메일 기반 로그인 및 중복 체크 처리
 */
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
