package com.moni.naos.domain.auth.repository;

import com.moni.naos.domain.auth.entity.OauthAccount;
import com.moni.naos.domain.auth.entity.OauthAccount.OauthProvider;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * OauthAccountRepository
 * - OAuth 계정 정보 관리
 */
public interface OauthAccountRepository extends JpaRepository<OauthAccount, Long> {

    /** Provider + ProviderId로 조회 */
    Optional<OauthAccount> findByProviderAndProviderId(OauthProvider provider, String providerId);

    /** User의 모든 OAuth 계정 조회 */
    List<OauthAccount> findByUser(User user);

    /** User ID로 OAuth 계정 조회 */
    List<OauthAccount> findByUserId(Long userId);

    /** 특정 Provider로 연결된 계정 존재 여부 */
    boolean existsByUserAndProvider(User user, OauthProvider provider);
}
