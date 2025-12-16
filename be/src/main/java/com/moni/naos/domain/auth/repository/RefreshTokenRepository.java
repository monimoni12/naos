package com.moni.naos.domain.auth.repository;

import com.moni.naos.domain.auth.entity.RefreshToken;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * RefreshTokenRepository
 * - 리프레시 토큰 관리
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /** 토큰 값으로 조회 */
    Optional<RefreshToken> findByToken(String token);

    /** User의 모든 토큰 조회 */
    List<RefreshToken> findByUser(User user);

    /** User의 유효한 토큰만 조회 */
    @Query("SELECT r FROM RefreshToken r WHERE r.user.id = :userId AND r.revoked = false AND r.expiresAt > CURRENT_TIMESTAMP")
    List<RefreshToken> findValidTokensByUserId(@Param("userId") Long userId);

    /** User의 모든 토큰 폐기 (로그아웃 전체) */
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId")
    void revokeAllByUserId(@Param("userId") Long userId);

    /** 만료된 토큰 삭제 (스케줄러용) */
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();
}
