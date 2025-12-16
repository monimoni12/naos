package com.moni.naos.domain.user.repository;

import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * UserRepository
 * - 사용자 인증/조회용 Repository
 * - 이메일 기반 로그인 및 중복 체크 처리
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /** 이메일로 조회 (로그인용) */
    Optional<User> findByEmail(String email);

    /** 이메일 중복 체크 */
    boolean existsByEmail(String email);

    /** Profile과 함께 조회 (N+1 방지) */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.email = :email")
    Optional<User> findByEmailWithProfile(@Param("email") String email);

    /** ID로 Profile과 함께 조회 */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.id = :id")
    Optional<User> findByIdWithProfile(@Param("id") Long id);
}
