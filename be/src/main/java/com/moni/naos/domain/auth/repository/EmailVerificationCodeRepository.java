package com.moni.naos.domain.auth.repository;

import com.moni.naos.domain.auth.entity.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

/**
 * EmailVerificationCodeRepository
 * - 이메일 인증 코드 관리
 */
public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    /** 이메일로 가장 최근 코드 조회 */
    Optional<EmailVerificationCode> findTopByEmailOrderByCreatedAtDesc(String email);

    /** 이메일로 인증 완료된 코드 조회 */
    Optional<EmailVerificationCode> findByEmailAndVerifiedTrue(String email);

    /** 이메일의 모든 코드 삭제 */
    @Modifying
    @Query("DELETE FROM EmailVerificationCode c WHERE c.email = :email")
    void deleteAllByEmail(String email);

    /** 만료된 코드 일괄 삭제 */
    @Modifying
    @Query("DELETE FROM EmailVerificationCode c WHERE c.expiresAt < :now")
    void deleteExpiredCodes(Instant now);
}
