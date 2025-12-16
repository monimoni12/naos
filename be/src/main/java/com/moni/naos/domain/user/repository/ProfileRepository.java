package com.moni.naos.domain.user.repository;

import com.moni.naos.domain.user.entity.Profile;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * ProfileRepository
 * - 프로필 조회/수정
 * - username으로 라우팅 (/user/{username})
 */
public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /** User로 Profile 조회 */
    Optional<Profile> findByUser(User user);

    /** user_id로 조회 */
    Optional<Profile> findByUserId(Long userId);

    /** username으로 조회 (프로필 페이지용) */
    Optional<Profile> findByUsername(String username);

    /** username 중복 체크 */
    boolean existsByUsername(String username);

    /** User와 함께 조회 (N+1 방지) */
    @Query("SELECT p FROM Profile p LEFT JOIN FETCH p.user WHERE p.username = :username")
    Optional<Profile> findByUsernameWithUser(@Param("username") String username);
}
