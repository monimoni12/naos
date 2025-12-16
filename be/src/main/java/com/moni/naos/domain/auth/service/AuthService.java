package com.moni.naos.domain.auth.service;

import com.moni.naos.domain.auth.dto.*;
import com.moni.naos.domain.auth.entity.EmailVerificationCode;
import com.moni.naos.domain.auth.entity.RefreshToken;
import com.moni.naos.domain.auth.repository.EmailVerificationCodeRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * AuthService - 인증 관련 비즈니스 로직
 * - 회원가입 (User + Profile 생성)
 * - 로그인 (이메일 또는 사용자명)
 * - 토큰 갱신
 * - 로그아웃
 * - 이메일 인증 (인스타 스타일)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String[] RESERVED_USERNAMES = {
            "admin", "administrator", "root", "system", "naos", "help", "support", "api", "www"
    };

    // ==================== 회원가입 단계별 API (인스타 스타일) ====================

    /**
     * 사용자명 사용 가능 여부 확인
     */
    public boolean isUsernameAvailable(String username) {
        // 예약어 체크
        String lower = username.toLowerCase();
        for (String reserved : RESERVED_USERNAMES) {
            if (lower.equals(reserved) || lower.contains(reserved)) {
                return false;
            }
        }
        // DB 중복 체크
        return !profileRepository.existsByUsername(username);
    }

    /**
     * 이메일 인증 코드 발송
     */
    @Transactional
    public void sendVerificationCode(String email) {
        // 이미 가입된 이메일인지 확인
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 기존 코드 삭제
        verificationCodeRepository.deleteAllByEmail(email);

        // 6자리 랜덤 코드 생성
        String code = generateCode();

        // 코드 저장 (5분 유효)
        EmailVerificationCode verificationCode = EmailVerificationCode.builder()
                .email(email)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(300))
                .verified(false)
                .build();
        verificationCodeRepository.save(verificationCode);

        // 이메일 발송 (개발 환경에서는 로그로 대체)
        sendEmail(email, code);
    }

    /**
     * 이메일 인증 코드 확인
     */
    @Transactional
    public boolean verifyEmailCode(String email, String code) {
        EmailVerificationCode verificationCode = verificationCodeRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("인증 코드를 먼저 발송해주세요."));

        // 만료 확인
        if (verificationCode.isExpired()) {
            throw new IllegalArgumentException("인증 코드가 만료되었습니다. 다시 발송해주세요.");
        }

        // 코드 일치 확인
        if (!verificationCode.getCode().equals(code)) {
            return false;
        }

        // 인증 완료 처리
        verificationCode.verify();
        verificationCodeRepository.save(verificationCode);
        return true;
    }

    /**
     * 회원가입
     */
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 2. username 중복 체크
        if (profileRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 사용자명입니다.");
        }

        // 3. 기본 Role 조회 (ROLE_USER)
        Role userRole = roleRepository.findByName(Role.RoleName.ROLE_USER)
                .orElseThrow(() -> new IllegalStateException("기본 권한(ROLE_USER)이 없습니다."));

        // 4. User 생성
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .active(true)
                .emailVerified(false)
                .build();
        
        User savedUser = userRepository.save(user);

        // 5. Profile 생성
        Profile profile = Profile.builder()
                .user(savedUser)
                .username(request.getUsername())
                .fullName(request.getFullName() != null ? request.getFullName() : request.getUsername())
                .birthDate(request.getBirthDate())
                .points(0)
                .isPublic(true)
                .build();
        
        profileRepository.save(profile);

        // 6. 인증 코드 삭제
        verificationCodeRepository.deleteAllByEmail(request.getEmail());

        log.info("회원가입 완료: userId={}, email={}", savedUser.getId(), savedUser.getEmail());

        return SignupResponse.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .username(profile.getUsername())
                .fullName(profile.getFullName())
                .message("회원가입이 완료되었습니다.")
                .build();
    }

    // ==================== 로그인/로그아웃 ====================

    /**
     * 로그인 (이메일 또는 사용자명)
     * @param identifier 이메일 또는 사용자명
     * @param password 비밀번호
     * @param deviceInfo 기기 정보 (서버에서 자동 추출)
     * @param ipAddress IP 주소 (서버에서 자동 추출)
     */
    @Transactional
    public LoginResponse login(String identifier, String password, String deviceInfo, String ipAddress) {
        // 1. 이메일 또는 username으로 User 조회
        User user = findUserByIdentifier(identifier);

        // 2. 계정 활성화 확인
        if (!user.getActive()) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        // 3. 비밀번호 검증
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일/사용자명 또는 비밀번호가 올바르지 않습니다.");
        }

        // 4. JWT Access Token 생성
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());

        // 5. Refresh Token 생성 및 저장
        String refreshTokenValue = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(expiresAt)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        // 6. Profile 정보 포함 응답
        Profile profile = user.getProfile();

        log.info("로그인 성공: userId={}, identifier={}, device={}", user.getId(), identifier, deviceInfo);

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

    /**
     * 이메일 또는 username으로 User 찾기
     */
    private User findUserByIdentifier(String identifier) {
        // @ 포함하면 이메일로 판단
        if (identifier.contains("@")) {
            return userRepository.findByEmailWithProfile(identifier)
                    .orElseThrow(() -> new IllegalArgumentException("이메일/사용자명 또는 비밀번호가 올바르지 않습니다."));
        }
        
        // username으로 조회
        Profile profile = profileRepository.findByUsername(identifier)
                .orElseThrow(() -> new IllegalArgumentException("이메일/사용자명 또는 비밀번호가 올바르지 않습니다."));
        
        return profile.getUser();
    }

    /**
     * 토큰 갱신
     */
    @Transactional
    public LoginResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다."));

        if (!refreshToken.isValid()) {
            throw new IllegalArgumentException("만료되었거나 폐기된 토큰입니다.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        Profile profile = user.getProfile();

        return LoginResponse.builder()
                .accessToken(newAccessToken)
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

    /**
     * 로그아웃
     */
    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(token -> {
                    token.revoke();
                    refreshTokenRepository.save(token);
                });
    }

    /**
     * 모든 기기에서 로그아웃
     */
    @Transactional
    public void logoutAll(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    /**
     * 이메일 존재 여부 확인
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // ==================== Helper ====================

    private String generateCode() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private void sendEmail(String email, String code) {
        // TODO: 실제 이메일 발송 구현 (SMTP, SendGrid, AWS SES 등)
        log.info("========================================");
        log.info("📧 인증 코드 발송");
        log.info("   To: {}", email);
        log.info("   Code: {}", code);
        log.info("   (개발 환경에서는 이 로그로 코드를 확인하세요)");
        log.info("========================================");
    }
}
