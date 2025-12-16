package com.moni.naos.global.init;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeAsset;
import com.moni.naos.domain.recipe.entity.RecipeClip;
import com.moni.naos.domain.recipe.entity.RecipeIngredient;
import com.moni.naos.domain.recipe.repository.RecipeAssetRepository;
import com.moni.naos.domain.recipe.repository.RecipeClipRepository;
import com.moni.naos.domain.recipe.repository.RecipeIngredientRepository;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RecipeDataInitializer - 레시피 시드 데이터 초기화
 * 
 * 카테고리:
 * - LOSS: 체중 감량용 저칼로리 레시피
 * - GAIN: 벌크업/체중 증가용 고단백 레시피
 * - BALANCE: 균형 잡힌 식단
 * - SNACK: 다이어트 간식
 */
@Slf4j
@Component
@Order(3)  // UserDataInitializer 이후 실행
@RequiredArgsConstructor
public class RecipeDataInitializer implements CommandLineRunner {

    private final RecipeRepository recipeRepository;
    private final RecipeAssetRepository recipeAssetRepository;
    private final RecipeClipRepository recipeClipRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final UserRepository userRepository;

    // S3 Base URLs
    private static final String VIDEO_BASE = "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/";
    private static final String THUMB_BASE = "https://naos-media.s3.ap-northeast-2.amazonaws.com/thumbnails/seed/";

    // S3 영상 URL들 (URL 인코딩된 파일명)
    private static final String[] VIDEO_URLS = {
        // 0. -12kg 유지어터 레시피 모음 (LOSS)
        VIDEO_BASE + "-12kg+%EC%9C%A0%EC%A7%80%EC%96%B4%ED%84%B0%EC%9D%98+%EC%A1%B4%EB%A7%9B+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EB%A0%88%EC%8B%9C%ED%94%BC+%EB%AA%A8%EC%9D%8Czip.mp4",
        // 1. 슬라이스 치즈 과자 (SNACK)
        VIDEO_BASE + "%5B%EC%B4%88%EA%B0%84%EB%8B%A8+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D+%EB%A0%88%EC%8B%9C%ED%94%BC%5D+__+%EC%8A%AC%EB%9D%BC%EC%9D%B4%EC%8A%A4+%EC%B9%98%EC%A6%88+%EA%B3%BC%EC%9E%90+%EB%A7%8C%EB%93%A4%EA%B8%B0+2%EB%B6%84%EC%9D%B4%EB%A9%B4+%EB%81%9D.mp4",
        // 2. 바나나 통깨 쿠키 (SNACK)
        VIDEO_BASE + "%F0%9F%8D%8C%EB%B0%94%EB%82%98%EB%82%98%EC%99%80+%ED%86%B5%EA%B9%A8%EB%A1%9C+%EB%A7%8C%EB%93%9C%EB%8A%94+%EC%BF%A0%ED%82%A4+_+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D+%EB%A0%88%EC%8B%9C%ED%94%BC+_+%EA%B7%B8%EB%A6%AD%EC%9A%94%EA%B1%B0%ED%8A%B8+%EC%B4%88%EC%BD%94%ED%95%84%EB%A7%81.mp4",
        // 3. 벌크업 식단 (GAIN)
        VIDEO_BASE + "%EA%B0%84%ED%8E%B8%ED%95%98%EA%B3%A0+%EB%A7%9B%EC%9E%88%EB%8A%94+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%8B%9D%EB%8B%A8+%EB%A7%8C%EB%93%A4%EA%B8%B0+%ED%8C%81!+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%8B%9D%EB%8B%A8%2C+%EB%B2%8C%ED%81%AC%EC%97%85+%EC%8B%9D%EB%8B%A8.mp4",
        // 4. 남궁민 벌크업 (GAIN)
        VIDEO_BASE + "%EB%82%A8%EA%B6%81%EB%AF%BC+%EB%B0%B0%EC%9A%B0%EC%9D%98+%EB%B2%8C%ED%81%AC%EC%97%85+%EC%8B%9D%EB%8B%A8+%EB%94%B0%EB%9D%BC%ED%95%B4%EB%B3%B4%EA%B8%B0.mp4",
        // 5. 야채수프 (LOSS)
        VIDEO_BASE + "%EB%82%B4+%EB%AA%B8%EC%9D%84+%ED%95%B4%EB%8F%85%ED%95%98%EB%8A%94+%EA%B1%B4%EA%B0%95%ED%95%9C+'%EC%95%BC%EC%B1%84%EC%88%98%ED%94%84'+%EB%A0%88%EC%8B%9C%ED%94%BC+%EB%8C%80%EA%B3%B5%EA%B0%9C!.mp4",
        // 6. 샐러드 레시피 (BALANCE)
        VIDEO_BASE + "%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EB%90%98%EB%8A%94+%EB%8B%B9%EB%87%A8+%ED%98%88%EB%8B%B9+%EA%B4%80%EB%A6%AC+%EB%8F%84%EC%8B%9C%EB%9D%BD+%F0%9F%92%95+%EC%83%90%EB%9F%AC%EB%93%9C+%EB%A0%88%EC%8B%9C%ED%94%BC+3%EA%B0%80%EC%A7%80.mp4",
        // 7. 병아리콩 과자 (SNACK)
        VIDEO_BASE + "%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8%EA%B0%84%EC%8B%9D%26%EC%A0%80%EC%86%8D%EB%85%B8%ED%99%94%EA%B3%BC%EC%9E%90%2C+%EB%B3%91%EC%95%84%EB%A6%AC%EC%BD%A9+%EA%B3%BC%EC%9E%90+%EB%A0%88%EC%8B%9C%ED%94%BC%2C+%EB%A7%A4%EC%9D%BC+%EB%A7%8C%EB%93%A4%EC%96%B4+%EB%A8%B9%EC%96%B4%EC%9A%94+%23%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8%EB%A0%88%EC%8B%9C%ED%94%BC+%23%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8%EA%B0%84%EC%8B%9D+%23%EB%B3%91%EC%95%84%EB%A6%AC%EC%BD%A9%EA%B3%BC%EC%9E%90.mp4",
        // 8. 오트밀 쑥떡 (SNACK)
        VIDEO_BASE + "%EB%8C%80%EB%B0%95%E2%80%BC%EF%B8%8F%EC%9D%B4%EB%96%A1%EC%9D%80+%EC%82%B4+%EC%95%88%EC%AA%84%EC%9A%94!++'%EC%A3%84%EC%B1%85%EA%B0%90+%EC%A0%9C%EB%A1%9C+%EB%96%A1'+%EB%A0%88%EC%8B%9C%ED%94%BC+(%EC%84%A4%ED%83%95X+%EC%8C%80X+%EC%B4%88%EA%B0%84%EB%8B%A8+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D%2C+%EC%98%A4%ED%8A%B8%EB%B0%80+%EC%91%A5%EB%96%A1+%EB%A8%B9%EA%B3%A0+%EC%91%A5%EB%9D%BC%EB%96%BC+%EB%A7%88%EC%8B%9C%EA%B8%B0).mp4",
        // 9. 두부 다이어트 (LOSS)
        VIDEO_BASE + "%EB%91%90%EB%B6%80%EB%A1%9C+6%EC%9D%BC+-5kg%F0%9F%AB%A2+7%EA%B0%80%EC%A7%80+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EB%A0%88%EC%8B%9C%ED%94%BC.mp4",
        // 10. 고구마빵 (BALANCE)
        VIDEO_BASE + "%EB%B0%80%EA%B0%80%EB%A3%A8%EB%B9%B5+%EB%A8%B9%EC%A7%80%EB%A7%90%EA%B3%A0+%EA%B3%A0%EA%B5%AC%EB%A7%88%EB%9E%91+%EA%B3%84%EB%9E%80%EB%A7%8C+%EC%A4%80%EB%B9%84%ED%95%98%EC%84%B8%EC%9A%94!+%EC%86%8D%ED%8E%B8%ED%95%98%EA%B2%8C+%EB%B1%83%EC%82%B4+%EC%8F%99+%EB%B9%A0%EC%A7%80%EB%8A%94+%EC%B4%88%EA%B0%84%EB%8B%A8+%EB%85%B8%EB%B0%80%EA%B0%80%EB%A3%A8+%EB%AC%B4%EC%84%A4%ED%83%95+%EA%B3%A0%EA%B5%AC%EB%A7%88%EB%B9%B5.mp4",
        // 11. 바나나 오트밀빵 (SNACK)
        VIDEO_BASE + "%EB%B0%94%EB%82%98%EB%82%981%EA%B0%9C%EB%A1%9C+%EB%A7%8C%EB%93%A0+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%98%A4%ED%8A%B8%EB%B0%80%EB%B9%B5+%EB%A0%88%EC%8B%9C%ED%94%BC!+%EB%B0%80%EA%B0%80%EB%A3%A8%EC%97%86%EC%9D%B4+%EA%B1%B4%EA%B0%95%ED%95%9C+%EA%B0%84%EC%8B%9D%EC%B6%94%EC%B2%9C!+(%EC%A2%85%EC%9D%B4%EC%BB%B5%EA%B3%84%EB%9F%89).mp4",
        // 12. 저당 프로틴바 (GAIN)
        VIDEO_BASE + "%EB%B3%B8%EA%B2%A9+%EC%97%AC%EB%A6%84%EB%A7%9E%EC%9D%B4%F0%9F%92%AA%F0%9F%8F%BB+%EC%A0%80%EB%8B%B9+%ED%94%84%EB%A1%9C%ED%8B%B4%EB%B0%94+%EB%A7%8C%EB%93%A4%EA%B8%B0+_+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D+%EB%A0%88%EC%8B%9C%ED%94%BC.mp4",
        // 13. 포케 레시피 (GAIN)
        VIDEO_BASE + "%EC%82%B4+%EC%89%BD%EA%B2%8C+%EB%B9%BC%EC%A3%BC%EB%8A%94+5%EA%B0%80%EC%A7%80+%ED%8F%AC%EC%BC%80+%EB%A0%88%EC%8B%9C%ED%94%BC%2C+4%EA%B0%80%EC%A7%80+%EC%86%8C%EC%8A%A4%2C+%EB%B0%80%ED%94%84%EB%9E%A9+%EB%A7%8C%EB%93%A4%EA%B8%B0%2C+%EB%84%88%EB%AC%B4+%EB%A7%9B%EC%9E%88%EC%96%B4%EC%84%9C+%EB%B0%9C%EC%9A%B0%EA%B3%B5%EC%96%91+%ED%95%98%EA%B2%8C%EB%8F%BC%EC%9A%94%F0%9F%98%8D(%EC%97%B0%EC%96%B4%ED%8F%AC%EC%BC%80%2C+%EC%96%91%EB%85%90%EB%AA%A9%EC%82%B4%ED%8F%AC%EC%BC%80%2C+%EA%B0%88%EB%A6%AD%EC%83%88%EC%9A%B0%ED%8F%AC%EC%BC%80%2C+%EC%B0%B8%EC%B9%98%EB%A7%88%EC%9A%94%ED%8F%AC%EC%BC%80%2C+%EB%B3%B4%EC%BD%94%EC%B9%98%EB%8B%88%ED%8F%AC%EC%BC%80).mp4",
        // 14. 토마토 계란 요리 (LOSS)
        VIDEO_BASE + "%EC%95%84%EC%B9%A8+%EC%A0%80%EB%85%81%EC%9C%BC%EB%A1%9C+%EB%B0%A5%EB%8C%80%EC%8B%A0+%EB%A8%B9%EC%9C%BC%EB%A9%B4+%EC%82%B4%EB%B9%A0%EC%A7%80%EB%8A%94+%ED%86%A0%EB%A7%88%ED%86%A0%EC%99%80+%EA%B3%84%EB%9E%80+%EC%9A%94%EB%A6%AC+5%EA%B0%80%EC%A7%80+%E2%80%BC%EF%B8%8F+%EC%97%BC%EC%A6%9D%EC%9D%B4+%EC%A4%84%EC%96%B4%EB%93%A4%EA%B3%A0+%ED%98%88%EA%B4%80%EC%9D%B4+%EA%B1%B4%EA%B0%95%ED%95%B4%EC%A7%80%EB%8A%94+%EC%9A%94%EB%A6%AC%F0%9F%92%AF%F0%9F%91%8D%F0%9F%8F%BB.mp4",
        // 15. 양배추 두부 (LOSS)
        VIDEO_BASE + "%EC%96%91%EB%B0%B0%EC%B6%94%EC%99%80+%EB%91%90%EB%B6%80%EB%A5%BC+%EC%9D%B4%EB%A0%87%EA%B2%8C+%EB%A8%B9%EC%9C%BC%EB%A9%B4+%EC%82%B4%EB%8F%84+%EC%95%88%EC%B0%8C%EA%B3%A0+%EB%84%88%EB%AC%B4+%EB%A7%9B%EC%9E%88%EC%96%B4%EC%9A%94%F0%9F%91%8D%F0%9F%8F%BB.mp4",
        // 16. 원플레이트 밀 (BALANCE)
        VIDEO_BASE + "%EC%9D%98%EC%82%AC%EB%93%A4%EA%B3%BC+%EC%98%81%EC%96%91+%EC%A0%84%EB%AC%B8%EA%B0%80%EB%93%A4%EC%9D%B4+%EA%B6%8C%EC%9E%A5%ED%95%98%EB%8A%94+%EC%9B%90%ED%94%8C%EB%A0%88%EC%9D%B4%ED%8A%B8+%EB%B0%80.+%ED%95%9C+%EC%A0%91%EC%8B%9C%EB%A9%B4+%EC%B6%A9%EB%B6%84%ED%95%A9%EB%8B%88%EB%8B%A4.+%ED%98%88%EB%8B%B9+%EC%95%88%EC%A0%95+%2B+%ED%8F%AC%EB%A7%8C%EA%B0%90+%2B+%EA%B7%A0%ED%98%95%2B+%EB%A7%9B!+%EC%9D%B4%EB%A0%87%EA%B2%8C%EB%A7%8C+%EB%A8%B9%EC%96%B4%EB%8F%84+%EC%9E%90%EC%97%B0%EC%8A%A4%EB%9F%BD%EA%B2%8C+%EC%B2%B4%EC%A4%91+%EA%B0%90%EC%86%8C!.mp4",
        // 17. 고구마케이크 (BALANCE)
        VIDEO_BASE + "%EC%9D%B8%EC%8A%A4%ED%83%80+60%EB%A7%8C%EB%B7%B0+%EB%A0%88%EC%8B%9C%ED%94%BC!!+%EB%8B%A8+4%EA%B0%80%EC%A7%80+%EC%9E%AC%EB%A3%8C%EB%A1%9C+%EB%A7%8C%EB%93%9C%EB%8A%94+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B3%A0%EA%B5%AC%EB%A7%88%EC%BC%80%EC%9D%B4%ED%81%AC+%E3%85%A3+%EB%85%B8%EB%B0%80%EA%B0%80%EB%A3%A8+%EB%85%B8%EC%84%A4%ED%83%95+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%8B%9D%EB%8B%A8.mp4"
    };

    // 썸네일 매핑 (알파벳순 정렬 기준)
    private static final String[] THUMB_FILES = {
        "thumb_03.jpg",  // [0] -12kg 유지어터
        "thumb_02.jpg",  // [1] 슬라이스 치즈 과자
        "thumb_04.jpg",  // [2] 바나나 통깨 쿠키
        "thumb_05.jpg",  // [3] 벌크업 식단
        "thumb_07.jpg",  // [4] 남궁민 벌크업
        "thumb_08.jpg",  // [5] 야채수프
        "thumb_10.jpg",  // [6] 샐러드 레시피
        "thumb_11.jpg",  // [7] 병아리콩 과자
        "thumb_12.jpg",  // [8] 오트밀 쑥떡
        "thumb_13.jpg",  // [9] 두부 다이어트
        "thumb_14.jpg",  // [10] 고구마빵
        "thumb_15.jpg",  // [11] 바나나 오트밀빵
        "thumb_16.jpg",  // [12] 저당 프로틴바
        "thumb_17.jpg",  // [13] 포케 레시피
        "thumb_18.jpg",  // [14] 토마토 계란 요리
        "thumb_19.jpg",  // [15] 양배추 두부
        "thumb_20.jpg",  // [16] 원플레이트 밀
        "thumb_21.jpg"   // [17] 고구마케이크
    };

    @Override
    @Transactional
    public void run(String... args) {
        if (recipeRepository.count() > 0) {
            log.info("레시피 시드 데이터 이미 존재 - 스킵");
            return;
        }

        log.info("========== 레시피 시드 데이터 초기화 시작 ==========");

        User seedUser = userRepository.findByEmail("seed@naos.com")
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("시드 유저가 필요합니다.")));

        // ==================== LOSS (감량) - 5개 ====================
        
        createRecipe(seedUser, "LOSS", 0,
                "-12kg 유지어터의 존맛 다이어트 레시피 모음",
                "12kg 감량 후 유지 중인 유지어터의 실제 식단입니다. 맛있고 포만감 있어요!",
                25, 1, 350, 7000, Recipe.Difficulty.MEDIUM,
                List.of("저탄수화물", "고단백"),
                List.of(ing("닭가슴살", "150g", 3000), ing("브로콜리", "100g", 1500), ing("현미밥", "1/2공기", 1000)),
                List.of(
                    clip(0, 0.0, 45.0, "오늘은 -12kg 감량 후 유지 중인 제 식단을 공개할게요. 재료들을 준비해주세요."),
                    clip(1, 45.0, 120.0, "닭가슴살은 소금, 후추로 밑간하고 팬에 구워주세요. 브로콜리는 데쳐줍니다."),
                    clip(2, 120.0, 180.0, "현미밥 위에 구운 닭가슴살과 브로콜리를 올려 완성합니다.")
                ));

        createRecipe(seedUser, "LOSS", 5,
                "내 몸을 해독하는 건강한 야채수프 레시피",
                "몸속 독소를 빼주는 건강한 야채수프! 다이어트할 때 든든하게 먹기 좋아요.",
                40, 4, 120, 10000, Recipe.Difficulty.EASY,
                List.of("저칼로리", "비건가능", "글루텐프리"),
                List.of(ing("양배추", "1/4통", 1500), ing("당근", "1개", 800), ing("셀러리", "2줄기", 1500), ing("토마토", "2개", 2000)),
                List.of(
                    clip(0, 0.0, 60.0, "해독 야채수프에 들어갈 재료들이에요. 양배추, 당근, 셀러리, 토마토를 준비해주세요."),
                    clip(1, 60.0, 150.0, "모든 야채를 먹기 좋은 크기로 썰어 냄비에 넣고 물을 부어주세요."),
                    clip(2, 150.0, 220.0, "30분 정도 끓이면 영양 가득한 해독수프 완성!")
                ));

        createRecipe(seedUser, "LOSS", 9,
                "두부로 6일 -5kg! 7가지 다이어트 레시피",
                "두부 하나로 만드는 7가지 레시피! 6일만에 5kg 감량 도전해보세요.",
                20, 1, 200, 3000, Recipe.Difficulty.EASY,
                List.of("저탄수화물", "고단백", "저칼로리"),
                List.of(ing("두부", "1모", 2000), ing("간장", "1큰술", 300), ing("참기름", "1작은술", 200)),
                List.of(
                    clip(0, 0.0, 50.0, "두부 다이어트의 핵심! 신선한 두부 1모를 준비해주세요."),
                    clip(1, 50.0, 130.0, "두부를 으깨서 팬에 볶아주세요. 간장과 참기름으로 간을 맞춰요."),
                    clip(2, 130.0, 180.0, "두부 볶음밥, 두부 스테이크 등 다양하게 활용 가능해요!")
                ));

        createRecipe(seedUser, "LOSS", 14,
                "토마토와 계란으로 만드는 5가지 다이어트 요리",
                "염증을 줄이고 혈관을 건강하게! 아침 저녁으로 밥 대신 먹으면 살빠져요.",
                15, 2, 180, 4000, Recipe.Difficulty.EASY,
                List.of("저탄수화물", "고단백"),
                List.of(ing("토마토", "2개", 2000), ing("계란", "3개", 1000), ing("올리브오일", "1큰술", 500)),
                List.of(
                    clip(0, 0.0, 40.0, "토마토와 계란의 완벽한 조합! 재료를 준비해주세요."),
                    clip(1, 40.0, 100.0, "토마토를 볶다가 계란을 풀어 스크램블 해주세요."),
                    clip(2, 100.0, 150.0, "간단하지만 영양 가득한 토마토 계란볶음 완성!")
                ));

        createRecipe(seedUser, "LOSS", 15,
                "양배추와 두부를 이렇게 먹으면 살도 안찌고 맛있어요",
                "양배추와 두부의 환상 조합! 포만감은 높고 칼로리는 낮아요.",
                25, 2, 150, 5000, Recipe.Difficulty.EASY,
                List.of("저칼로리", "고단백", "비건가능"),
                List.of(ing("양배추", "1/4통", 1500), ing("두부", "1/2모", 1000), ing("된장", "1큰술", 500)),
                List.of(
                    clip(0, 0.0, 45.0, "양배추와 두부, 된장을 준비해주세요."),
                    clip(1, 45.0, 110.0, "양배추를 채썰고 두부는 깍둑썰기 해주세요."),
                    clip(2, 110.0, 160.0, "된장과 함께 볶으면 맛있는 다이어트 반찬 완성!")
                ));

        log.info("체중 감량(LOSS) 레시피 5개 생성 완료");

        // ==================== GAIN (증량/벌크업) - 4개 ====================

        createRecipe(seedUser, "GAIN", 3,
                "간편하고 맛있는 벌크업 식단 만들기 팁",
                "벌크업 중이라면 이렇게 드세요! 간편하면서도 고단백 식단입니다.",
                30, 1, 600, 12000, Recipe.Difficulty.MEDIUM,
                List.of("고단백", "벌크업"),
                List.of(ing("닭가슴살", "200g", 4000), ing("현미밥", "1공기", 2000), ing("계란", "3개", 1000), ing("아보카도", "1개", 3000)),
                List.of(
                    clip(0, 0.0, 50.0, "벌크업 식단의 핵심 재료들! 고단백 위주로 준비해주세요."),
                    clip(1, 50.0, 130.0, "닭가슴살은 굽고, 계란은 삶아주세요. 아보카도는 슬라이스해요."),
                    clip(2, 130.0, 190.0, "현미밥과 함께 플레이팅하면 완벽한 벌크업 한 끼 완성!")
                ));

        createRecipe(seedUser, "GAIN", 4,
                "남궁민 배우의 벌크업 식단 따라해보기",
                "남궁민 배우처럼 근육질 몸매를 만들고 싶다면 이 식단을 따라해보세요!",
                40, 1, 700, 15000, Recipe.Difficulty.MEDIUM,
                List.of("고단백", "벌크업"),
                List.of(ing("소고기", "200g", 8000), ing("고구마", "1개", 1500), ing("브로콜리", "100g", 1500), ing("계란", "4개", 1300)),
                List.of(
                    clip(0, 0.0, 60.0, "배우들의 식단 비결! 양질의 단백질과 탄수화물을 준비해주세요."),
                    clip(1, 60.0, 150.0, "소고기는 미디엄으로 굽고, 고구마는 에어프라이어에 구워주세요."),
                    clip(2, 150.0, 220.0, "단백질 위주로 구성된 벌크업 식단 완성!")
                ));

        createRecipe(seedUser, "GAIN", 12,
                "본격 여름맞이 저당 프로틴바 만들기",
                "헬스장 가기 전 간식으로 딱! 직접 만드는 건강한 프로틴바입니다.",
                45, 8, 250, 15000, Recipe.Difficulty.MEDIUM,
                List.of("고단백", "무설탕"),
                List.of(ing("프로틴파우더", "2스쿱", 5000), ing("오트밀", "1컵", 1500), ing("땅콩버터", "3큰술", 3000), ing("꿀", "2큰술", 1500)),
                List.of(
                    clip(0, 0.0, 55.0, "프로틴바 재료들을 준비해주세요. 프로틴파우더는 좋아하는 맛으로!"),
                    clip(1, 55.0, 140.0, "모든 재료를 잘 섞어서 틀에 꾹꾹 눌러 담아주세요."),
                    clip(2, 140.0, 200.0, "냉장고에서 2시간 굳히면 홈메이드 프로틴바 완성!")
                ));

        createRecipe(seedUser, "GAIN", 13,
                "살 쉽게 빼주는 5가지 포케 레시피",
                "포케로 맛있게 단백질 섭취! 연어, 참치, 새우 등 다양한 버전이에요.",
                35, 2, 450, 18000, Recipe.Difficulty.HARD,
                List.of("고단백", "저탄수화물"),
                List.of(ing("연어", "150g", 8000), ing("아보카도", "1개", 3000), ing("현미밥", "1공기", 2000), ing("간장소스", "3큰술", 1000)),
                List.of(
                    clip(0, 0.0, 70.0, "포케 재료들을 신선하게 준비해주세요. 연어는 회 등급으로!"),
                    clip(1, 70.0, 160.0, "연어와 아보카도를 깍둑썰기하고 소스를 만들어주세요."),
                    clip(2, 160.0, 230.0, "현미밥 위에 예쁘게 토핑하면 레스토랑급 포케 완성!")
                ));

        log.info("벌크업(GAIN) 레시피 4개 생성 완료");

        // ==================== BALANCE (균형 식단) - 4개 ====================

        createRecipe(seedUser, "BALANCE", 6,
                "다이어트 되는 당뇨 혈당 관리 샐러드 3가지",
                "혈당 관리하면서 다이어트도 되는 도시락 샐러드 레시피예요!",
                20, 1, 280, 8000, Recipe.Difficulty.EASY,
                List.of("저탄수화물", "당뇨친화"),
                List.of(ing("양상추", "1/2통", 2000), ing("닭가슴살", "100g", 2500), ing("방울토마토", "10개", 1500), ing("올리브오일드레싱", "2큰술", 1000)),
                List.of(
                    clip(0, 0.0, 45.0, "신선한 샐러드 재료들을 준비해주세요."),
                    clip(1, 45.0, 100.0, "양상추를 먹기 좋게 뜯고 닭가슴살은 구워서 슬라이스해요."),
                    clip(2, 100.0, 150.0, "모든 재료를 담고 드레싱을 뿌리면 완성!")
                ));

        createRecipe(seedUser, "BALANCE", 10,
                "밀가루빵 먹지말고 고구마랑 계란만 준비하세요!",
                "속편하게 뱃살 쏙 빠지는 초간단 노밀가루 무설탕 고구마빵이에요.",
                35, 4, 200, 5000, Recipe.Difficulty.EASY,
                List.of("글루텐프리", "무설탕"),
                List.of(ing("고구마", "2개", 2500), ing("계란", "2개", 700), ing("베이킹파우더", "1작은술", 300)),
                List.of(
                    clip(0, 0.0, 50.0, "고구마빵 재료는 딱 3가지! 고구마, 계란, 베이킹파우더예요."),
                    clip(1, 50.0, 120.0, "고구마를 삶아서 으깨고 계란, 베이킹파우더와 섞어주세요."),
                    clip(2, 120.0, 180.0, "180도 오븐에서 25분 구우면 촉촉한 고구마빵 완성!")
                ));

        createRecipe(seedUser, "BALANCE", 16,
                "의사들과 영양 전문가들이 권장하는 원플레이트 밀",
                "한 접시면 충분! 혈당 안정 + 포만감 + 균형 + 맛까지 잡은 식단이에요.",
                30, 1, 400, 10000, Recipe.Difficulty.MEDIUM,
                List.of("균형식단", "저염식"),
                List.of(ing("현미밥", "1/2공기", 1000), ing("연어", "80g", 4000), ing("아보카도", "1/2개", 1500), ing("채소믹스", "1컵", 2000)),
                List.of(
                    clip(0, 0.0, 55.0, "원플레이트 식단의 황금 비율! 탄단지를 골고루 준비해요."),
                    clip(1, 55.0, 130.0, "연어를 굽고 채소를 손질해서 접시에 예쁘게 담아주세요."),
                    clip(2, 130.0, 185.0, "이렇게만 먹어도 자연스럽게 체중이 줄어들어요!")
                ));

        createRecipe(seedUser, "BALANCE", 17,
                "인스타 60만뷰 레시피! 단 4가지 재료 다이어트 고구마케이크",
                "노밀가루 노설탕으로 만드는 건강한 고구마케이크예요!",
                50, 6, 180, 7000, Recipe.Difficulty.MEDIUM,
                List.of("글루텐프리", "무설탕"),
                List.of(ing("고구마", "3개", 4000), ing("계란", "3개", 1000), ing("우유", "1/2컵", 500), ing("시나몬", "1작은술", 300)),
                List.of(
                    clip(0, 0.0, 60.0, "60만뷰의 비결! 단 4가지 재료만 준비하세요."),
                    clip(1, 60.0, 150.0, "고구마를 삶아 으깨고 계란, 우유, 시나몬과 잘 섞어주세요."),
                    clip(2, 150.0, 220.0, "틀에 담아 170도에서 40분 구우면 촉촉한 케이크 완성!")
                ));

        log.info("균형 식단(BALANCE) 레시피 4개 생성 완료");

        // ==================== SNACK (다이어트 간식) - 5개 ====================

        createRecipe(seedUser, "SNACK", 1,
                "[초간단 다이어트 간식] 슬라이스 치즈 과자 만들기",
                "2분이면 끝! 슬라이스 치즈로 바삭한 과자를 만들어요.",
                5, 2, 80, 1500, Recipe.Difficulty.EASY,
                List.of("저탄수화물", "글루텐프리"),
                List.of(ing("슬라이스치즈", "4장", 1500)),
                List.of(
                    clip(0, 0.0, 30.0, "슬라이스 치즈만 있으면 OK! 냉장고에서 꺼내주세요."),
                    clip(1, 30.0, 80.0, "치즈를 전자레인지용 접시에 올리고 1분 30초 돌려주세요."),
                    clip(2, 80.0, 120.0, "바삭바삭한 치즈칩 완성! 식혀서 드세요.")
                ));

        createRecipe(seedUser, "SNACK", 2,
                "바나나와 통깨로 만드는 쿠키",
                "그릭요거트 초코필링까지! 건강한 다이어트 간식이에요.",
                25, 10, 90, 4000, Recipe.Difficulty.EASY,
                List.of("글루텐프리", "무설탕"),
                List.of(ing("바나나", "2개", 1400), ing("통깨", "1/2컵", 1500), ing("그릭요거트", "3큰술", 1000)),
                List.of(
                    clip(0, 0.0, 40.0, "바나나, 통깨, 그릭요거트를 준비해주세요."),
                    clip(1, 40.0, 110.0, "바나나를 으깨고 통깨를 섞어 동그랗게 빚어주세요."),
                    clip(2, 110.0, 160.0, "오븐 180도에서 15분 구우면 고소한 바나나쿠키 완성!")
                ));

        createRecipe(seedUser, "SNACK", 7,
                "다이어트 간식 & 저속노화 병아리콩 과자",
                "매일 만들어 먹는 바삭한 병아리콩 과자! 저속노화에 좋아요.",
                30, 4, 150, 3000, Recipe.Difficulty.EASY,
                List.of("고단백", "비건가능"),
                List.of(ing("병아리콩", "1캔", 2000), ing("올리브오일", "1큰술", 500), ing("파프리카파우더", "1작은술", 300)),
                List.of(
                    clip(0, 0.0, 50.0, "저속노화의 비밀! 병아리콩, 올리브오일, 파프리카파우더를 준비해주세요."),
                    clip(1, 50.0, 130.0, "병아리콩 물기를 빼고 올리브오일, 양념을 버무려주세요."),
                    clip(2, 130.0, 190.0, "에어프라이어 180도 20분이면 바삭한 병아리콩 스낵 완성!")
                ));

        createRecipe(seedUser, "SNACK", 8,
                "죄책감 제로 떡! 다이어트 오트밀 쑥떡",
                "설탕X 쌀X 초간단 다이어트 간식! 오트밀 쑥떡 먹고 쑥라떼 마시기.",
                15, 2, 130, 3500, Recipe.Difficulty.EASY,
                List.of("무설탕", "글루텐프리"),
                List.of(ing("오트밀", "1컵", 1500), ing("쑥가루", "1큰술", 800), ing("우유", "1/2컵", 500)),
                List.of(
                    clip(0, 0.0, 40.0, "죄책감 제로 떡! 오트밀, 쑥가루, 우유를 준비해주세요."),
                    clip(1, 40.0, 100.0, "오트밀을 갈고 쑥가루, 우유를 섞어 반죽을 만들어요."),
                    clip(2, 100.0, 140.0, "전자레인지 3분이면 쫀득한 오트밀 쑥떡 완성!")
                ));

        createRecipe(seedUser, "SNACK", 11,
                "바나나 1개로 만든 다이어트 오트밀빵",
                "밀가루없이 건강한 간식! 종이컵 계량으로 쉽게 만들어요.",
                25, 4, 140, 3000, Recipe.Difficulty.EASY,
                List.of("글루텐프리", "무설탕"),
                List.of(ing("바나나", "1개", 700), ing("오트밀", "1컵", 1500), ing("계란", "1개", 300)),
                List.of(
                    clip(0, 0.0, 45.0, "바나나 1개면 충분! 바나나, 오트밀, 계란을 준비해주세요."),
                    clip(1, 45.0, 110.0, "바나나를 으깨고 오트밀, 계란을 섞어 반죽을 만들어요."),
                    clip(2, 110.0, 160.0, "머핀틀에 담아 180도 20분 구우면 촉촉한 오트밀빵 완성!")
                ));

        log.info("다이어트 간식(SNACK) 레시피 5개 생성 완료");

        log.info("========== 레시피 시드 데이터 초기화 완료: {}개 (클립 {}개) ==========", 
                recipeRepository.count(), recipeClipRepository.count());
    }

    // ==================== Helper Methods ====================

    /**
     * 레시피 생성
     * @param urlIndex VIDEO_URLS 및 THUMB_FILES의 인덱스
     */
    private void createRecipe(User author, String category, int urlIndex,
                              String title, String caption,
                              Integer cookTimeMin, Integer servings,
                              Integer kcalEstimate, Integer priceEstimate,
                              Recipe.Difficulty difficulty,
                              List<String> dietTags, 
                              List<IngredientData> ingredients,
                              List<ClipData> clips) {
        
        Recipe recipe = Recipe.builder()
                .author(author)
                .title(title)
                .caption(caption)
                .category(category)
                .cookTimeMin(cookTimeMin)
                .servings(servings)
                .kcalEstimate(kcalEstimate)
                .priceEstimate(priceEstimate)
                .difficulty(difficulty)
                .dietTags(dietTags)
                .visibility(Recipe.Visibility.PUBLIC)
                .build();

        Recipe saved = recipeRepository.save(recipe);

        // 영상 Asset 추가
        RecipeAsset videoAsset = RecipeAsset.builder()
                .recipe(saved)
                .type(RecipeAsset.Type.VIDEO)
                .url(VIDEO_URLS[urlIndex])
                .build();
        recipeAssetRepository.save(videoAsset);

        // 썸네일 Asset 추가
        RecipeAsset thumbAsset = RecipeAsset.builder()
                .recipe(saved)
                .type(RecipeAsset.Type.THUMB)
                .url(THUMB_BASE + THUMB_FILES[urlIndex])
                .build();
        recipeAssetRepository.save(thumbAsset);

        // 재료 추가
        for (int i = 0; i < ingredients.size(); i++) {
            IngredientData ing = ingredients.get(i);
            RecipeIngredient ingredient = RecipeIngredient.builder()
                    .recipe(saved)
                    .name(ing.name)
                    .amount(ing.amount)
                    .price(ing.price)
                    .orderIndex(i)
                    .build();
            recipeIngredientRepository.save(ingredient);
        }

        // 클립 추가
        for (ClipData clipData : clips) {
            RecipeClip clip = RecipeClip.builder()
                    .recipe(saved)
                    .indexOrd(clipData.index)
                    .startSec(clipData.startSec)
                    .endSec(clipData.endSec)
                    .caption(clipData.caption)
                    .build();
            recipeClipRepository.save(clip);
        }

        log.debug("레시피 생성: {} ({}) - 난이도: {}, 클립 {}개", title, category, difficulty, clips.size());
    }

    private static IngredientData ing(String name, String amount, int price) {
        return new IngredientData(name, amount, price);
    }

    private static ClipData clip(int index, double startSec, double endSec, String caption) {
        return new ClipData(index, startSec, endSec, caption);
    }

    private record IngredientData(String name, String amount, int price) {}
    private record ClipData(int index, double startSec, double endSec, String caption) {}
}
