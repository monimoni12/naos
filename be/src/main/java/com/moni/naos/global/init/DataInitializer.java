package com.moni.naos.global.init;

import com.moni.naos.domain.reward.entity.Badge;
import com.moni.naos.domain.reward.entity.RewardPolicy;
import com.moni.naos.domain.reward.entity.RewardTier;
import com.moni.naos.domain.reward.repository.BadgeRepository;
import com.moni.naos.domain.reward.repository.RewardPolicyRepository;
import com.moni.naos.domain.reward.repository.RewardTierRepository;
import com.moni.naos.domain.user.entity.Profile;
import com.moni.naos.domain.user.entity.Role;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.ProfileRepository;
import com.moni.naos.domain.user.repository.RoleRepository;
import com.moni.naos.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DataInitializer - 서버 시작 시 초기 데이터 자동 삽입
 * - 테이블이 비어있을 때만 데이터 삽입
 * - ddl-auto: create 해도 자동으로 필수 데이터 채워짐
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final RewardTierRepository rewardTierRepository;
    private final RewardPolicyRepository rewardPolicyRepository;
    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        initRoles();
        initRewardTiers();
        initRewardPolicies();
        initBadges();
        initSeedUsers();
    }

    // ==================== Seed Users ====================
    private void initSeedUsers() {
        // 메인 시드 유저 (레시피 보유)
        createUserIfNotExists("seed@naos.com", "seed1234!", "naos_official", "NAOS 공식", "건강한 레시피를 공유합니다 🥗");

        // 더미 유저들 (테스트용)
        createUserIfNotExists("user1@test.com", "test1234!", "healthy_cook", "건강한 요리사", "매일 건강식을 만들어요 🥦");
        createUserIfNotExists("user2@test.com", "test1234!", "diet_master", "다이어트 마스터", "다이어트 레시피 전문가 💪");
        createUserIfNotExists("user3@test.com", "test1234!", "home_chef", "집밥 셰프", "집에서 만드는 맛있는 요리 🍳");
        createUserIfNotExists("user4@test.com", "test1234!", "vegan_life", "비건 라이프", "비건 레시피를 공유해요 🌱");
        createUserIfNotExists("user5@test.com", "test1234!", "quick_meal", "빠른 한끼", "10분 안에 완성하는 레시피 ⏱️");

        log.info("✅ 시드 유저 생성 완료 (6명)");
    }

    private void createUserIfNotExists(String email, String password, String username, String fullName, String bio) {
        if (userRepository.findByEmail(email).isPresent()) return;

        Role userRole = roleRepository.findByName(Role.RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("ROLE_USER가 필요합니다."));

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(userRole)
                .build();
        userRepository.save(user);

        Profile profile = Profile.builder()
                .user(user)
                .username(username)
                .fullName(fullName)
                .bio(bio)
                .build();
        profileRepository.save(profile);
    }

    // ==================== Roles ====================
    private void initRoles() {
        if (roleRepository.count() > 0) return;

        roleRepository.save(Role.builder()
                .name(Role.RoleName.ROLE_USER)
                .description("일반 사용자")
                .build());
        roleRepository.save(Role.builder()
                .name(Role.RoleName.ROLE_ADMIN)
                .description("관리자")
                .build());

        log.info("✅ Roles 초기화 완료 (ROLE_USER, ROLE_ADMIN)");
    }

    // ==================== Reward Tiers ====================
    private void initRewardTiers() {
        if (rewardTierRepository.count() > 0) return;

        rewardTierRepository.save(RewardTier.builder()
                .code("BRONZE").name("브론즈").minPoints(0).displayOrder(1).iconUrl("/badges/bronze.png").build());
        rewardTierRepository.save(RewardTier.builder()
                .code("SILVER").name("실버").minPoints(1000).displayOrder(2).iconUrl("/badges/silver.png").build());
        rewardTierRepository.save(RewardTier.builder()
                .code("GOLD").name("골드").minPoints(3000).displayOrder(3).iconUrl("/badges/gold.png").build());
        rewardTierRepository.save(RewardTier.builder()
                .code("PLATINUM").name("플래티넘").minPoints(10000).displayOrder(4).iconUrl("/badges/platinum.png").build());
        rewardTierRepository.save(RewardTier.builder()
                .code("DIAMOND").name("다이아몬드").minPoints(30000).displayOrder(5).iconUrl("/badges/diamond.png").build());

        log.info("✅ RewardTiers 초기화 완료 (5개 등급)");
    }

    // ==================== Reward Policies ====================
    private void initRewardPolicies() {
        if (rewardPolicyRepository.count() > 0) return;

        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("RECIPE_UPLOAD").delta(100).title("레시피 업로드").active(true).note("새로운 레시피 등록 시").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("RECIPE_DELETE").delta(-50).title("레시피 삭제").active(true).note("본인 레시피 삭제 시").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("LIKE_RECEIVED").delta(5).title("좋아요 받음").active(true).note("내 레시피가 좋아요 받을 때").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("COMMENT_RECEIVED").delta(10).title("댓글 받음").active(true).note("내 레시피에 댓글 달릴 때").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("BOOKMARK_RECEIVED").delta(15).title("스크랩 받음").active(true).note("내 레시피가 스크랩될 때").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("COMMENT_WRITE").delta(5).title("댓글 작성").active(true).note("다른 레시피에 댓글 달 때").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("LIKE_GIVE").delta(1).title("좋아요 누름").active(true).note("다른 레시피 좋아요 할 때").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("COOKING_START").delta(10).title("요리 시작").active(true).note("요리 세션 시작 시").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("COOKING_COMPLETE").delta(50).title("요리 완료").active(true).note("레시피 완주 시").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("FOLLOW_RECEIVED").delta(20).title("팔로워 증가").active(true).note("누군가 나를 팔로우할 때").build());
        rewardPolicyRepository.save(RewardPolicy.builder()
                .action("REPORT_PENALTY").delta(-100).title("신고 패널티").active(true).note("부적절한 콘텐츠 신고 확정 시").build());

        log.info("✅ RewardPolicies 초기화 완료 (11개 정책)");
    }

    // ==================== Badges ====================
    private void initBadges() {
        if (badgeRepository.count() > 0) return;

        badgeRepository.save(Badge.builder()
                .code("NEWCOMER").title("새싹 요리사").subtitle("첫 레시피를 등록했어요")
                .iconUrl("/badges/newcomer.png").displayOrder(1).pointsRequired(0).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("FIRST_COOKING").title("요리 도전").subtitle("첫 요리를 시작했어요")
                .iconUrl("/badges/first_cooking.png").displayOrder(2).pointsRequired(0).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("RECIPE_5").title("요리 탐험가").subtitle("5개의 레시피 등록")
                .iconUrl("/badges/recipe_5.png").displayOrder(10).pointsRequired(500).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("RECIPE_10").title("요리 장인").subtitle("10개의 레시피 등록")
                .iconUrl("/badges/recipe_10.png").displayOrder(11).pointsRequired(1000).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("RECIPE_50").title("요리 마스터").subtitle("50개의 레시피 등록")
                .iconUrl("/badges/recipe_50.png").displayOrder(12).pointsRequired(5000).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("LIKE_100").title("인기 요리사").subtitle("좋아요 100개 받음")
                .iconUrl("/badges/like_100.png").displayOrder(20).pointsRequired(500).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("FOLLOWER_50").title("영향력자").subtitle("팔로워 50명 달성")
                .iconUrl("/badges/follower_50.png").displayOrder(21).pointsRequired(1000).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("COMMENT_100").title("소통왕").subtitle("댓글 100개 작성")
                .iconUrl("/badges/comment_100.png").displayOrder(22).pointsRequired(500).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("DIET_WEEK").title("다이어트 초심자").subtitle("7일 연속 건강식 도전")
                .iconUrl("/badges/diet_week.png").displayOrder(30).pointsRequired(350).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("DIET_MONTH").title("다이어트 습관왕").subtitle("30일 연속 건강식 도전")
                .iconUrl("/badges/diet_month.png").displayOrder(31).pointsRequired(1500).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("TIER_SILVER").title("실버 달성").subtitle("실버 등급 도달")
                .iconUrl("/badges/tier_silver.png").displayOrder(40).pointsRequired(1000).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("TIER_GOLD").title("골드 달성").subtitle("골드 등급 도달")
                .iconUrl("/badges/tier_gold.png").displayOrder(41).pointsRequired(3000).active(true).build());
        badgeRepository.save(Badge.builder()
                .code("TIER_PLATINUM").title("플래티넘 달성").subtitle("플래티넘 등급 도달")
                .iconUrl("/badges/tier_platinum.png").displayOrder(42).pointsRequired(10000).active(true).build());

        log.info("✅ Badges 초기화 완료 (13개 배지)");
    }
}
