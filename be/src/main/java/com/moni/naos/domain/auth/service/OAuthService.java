package com.moni.naos.domain.auth.service;

import com.moni.naos.domain.auth.dto.LoginResponse;
import com.moni.naos.domain.auth.entity.OauthAccount;
import com.moni.naos.domain.auth.entity.OauthAccount.OauthProvider;
import com.moni.naos.domain.auth.entity.RefreshToken;
import com.moni.naos.domain.auth.repository.OauthAccountRepository;
import com.moni.naos.domain.auth.repository.RefreshTokenRepository;
import com.moni.naos.domain.user.entity.Profile;
import com.moni.naos.domain.user.entity.Role;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.ProfileRepository;
import com.moni.naos.domain.user.repository.RoleRepository;
import com.moni.naos.domain.user.repository.UserRepository;
import com.moni.naos.global.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

/**
 * OAuthService - 소셜 로그인 비즈니스 로직
 * - Google, Kakao, Naver OAuth 처리
 * - 신규 유저 자동 가입
 * - 기존 유저 연동
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OAuthService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final OauthAccountRepository oauthAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    // Google OAuth 설정
    @Value("${custom.oauth.google.client-id:}")
    private String googleClientId;

    @Value("${custom.oauth.google.redirect-uri:http://localhost:8090/api/auth/oauth/google/callback}")
    private String googleRedirectUri;

    // Kakao OAuth 설정
    @Value("${custom.oauth.kakao.client-id:}")
    private String kakaoClientId;

    @Value("${custom.oauth.kakao.redirect-uri:http://localhost:8090/api/auth/oauth/kakao/callback}")
    private String kakaoRedirectUri;

    // Naver OAuth 설정
    @Value("${custom.oauth.naver.client-id:}")
    private String naverClientId;

    @Value("${custom.oauth.naver.redirect-uri:http://localhost:8090/api/auth/oauth/naver/callback}")
    private String naverRedirectUri;

    /**
     * Google 인증 URL 생성
     */
    public String getGoogleAuthUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + googleClientId +
                "&redirect_uri=" + googleRedirectUri +
                "&response_type=code" +
                "&scope=email%20profile" +
                "&access_type=offline";
    }

    /**
     * Kakao 인증 URL 생성
     */
    public String getKakaoAuthUrl() {
        return "https://kauth.kakao.com/oauth/authorize" +
                "?client_id=" + kakaoClientId +
                "&redirect_uri=" + kakaoRedirectUri +
                "&response_type=code";
    }

    /**
     * Naver 인증 URL 생성
     */
    public String getNaverAuthUrl() {
        String state = UUID.randomUUID().toString();
        return "https://nid.naver.com/oauth2.0/authorize" +
                "?client_id=" + naverClientId +
                "&redirect_uri=" + naverRedirectUri +
                "&response_type=code" +
                "&state=" + state;
    }

    /**
     * OAuth 로그인 처리 (공통)
     * - 기존 OAuth 계정 있으면 로그인
     * - 없으면 신규 가입 후 로그인
     */
    @Transactional
    public LoginResponse processOAuthLogin(
            OauthProvider provider,
            String providerId,
            String email,
            String name,
            String avatarUrl
    ) {
        // 1. 기존 OAuth 계정 조회
        Optional<OauthAccount> existingAccount = oauthAccountRepository
                .findByProviderAndProviderId(provider, providerId);

        User user;

        if (existingAccount.isPresent()) {
            // 기존 계정으로 로그인
            user = existingAccount.get().getUser();
            log.info("OAuth login - existing user: {}", user.getEmail());
        } else {
            // 신규 가입
            user = createOAuthUser(provider, providerId, email, name, avatarUrl);
            log.info("OAuth login - new user created: {}", user.getEmail());
        }

        // 2. JWT 토큰 발급
        return generateLoginResponse(user);
    }

    /**
     * OAuth 신규 유저 생성
     */
    @Transactional
    protected User createOAuthUser(
            OauthProvider provider,
            String providerId,
            String email,
            String name,
            String avatarUrl
    ) {
        // 1. 이메일로 기존 User 조회 (이메일 로그인으로 가입한 경우)
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            // 기존 User에 OAuth 계정 연동
            user = existingUser.get();
        } else {
            // 새 User 생성
            Role userRole = roleRepository.findByName(Role.RoleName.ROLE_USER)
                    .orElseThrow(() -> new IllegalStateException("기본 권한(ROLE_USER)이 없습니다."));

            user = User.builder()
                    .email(email)
                    .passwordHash(null)  // OAuth는 비밀번호 없음
                    .role(userRole)
                    .active(true)
                    .emailVerified(true) // OAuth는 이메일 인증 완료
                    .build();

            user = userRepository.save(user);

            // Profile 생성
            String username = generateUniqueUsername(name);
            Profile profile = Profile.builder()
                    .user(user)
                    .username(username)
                    .fullName(name != null ? name : username)
                    .avatarUrl(avatarUrl)
                    .points(0)
                    .isPublic(true)
                    .build();

            profileRepository.save(profile);
        }

        // 2. OAuth 계정 정보 저장
        OauthAccount oauthAccount = OauthAccount.builder()
                .user(user)
                .provider(provider)
                .providerId(providerId)
                .providerEmail(email)
                .providerAvatarUrl(avatarUrl)
                .build();

        oauthAccountRepository.save(oauthAccount);

        return user;
    }

    /**
     * 고유한 username 생성
     */
    private String generateUniqueUsername(String name) {
        String baseUsername = name != null ? 
                name.toLowerCase().replaceAll("[^a-z0-9]", "") : "user";
        
        if (baseUsername.length() < 3) {
            baseUsername = "user";
        }
        if (baseUsername.length() > 15) {
            baseUsername = baseUsername.substring(0, 15);
        }

        String username = baseUsername;
        int suffix = 1;

        while (profileRepository.existsByUsername(username)) {
            username = baseUsername + suffix;
            suffix++;
        }

        return username;
    }

    /**
     * 로그인 응답 생성
     */
    private LoginResponse generateLoginResponse(User user) {
        // Access Token 생성
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());

        // Refresh Token 생성 및 저장
        String refreshTokenValue = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(expiresAt)
                .deviceInfo("OAuth Login")
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        // Profile 정보
        Profile profile = user.getProfile();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .userId(user.getId())
                .email(user.getEmail())
                .username(profile != null ? profile.getUsername() : null)
                .fullName(profile != null ? profile.getFullName() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .build();
    }
}
