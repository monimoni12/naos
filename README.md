<a href="https://www.naosss.site/" target="_blank">
<img alt="naos fishy" src="https://github.com/user-attachments/assets/9475d693-911c-49d2-8a54-59bc6c04abed" alt="배너" width="100%" />
</a>

# 20~34세 MZ세대의 체중 감량을 위한, 가성비 다이어트 레시피 공유 커뮤니티 플랫폼, NAOS

## Introducing our team [MONI]
 |이은서(29)|
 |:------:|
 | <img src=https://github.com/user-attachments/assets/5bd4b56f-3b71-45e9-8b85-be926de56cdc alt="이은서" width="150"> | 
 | FE, BE, PM |
 | [GitHub](https://github.com/monimoni12) |
 
 <br/>
 <br/>

# 0. Getting Started (시작하기)
```bash
 _   _    _    ___  ____  
| \ | |  / \  / _ \/ ___| 
|  \| | / _ \| | | \___ \ 
| |\  |/ ___ \ |_| |___) |
|_| \_/_/   \_\___/|____/ 

:: NAOS - AI Recipe Platform ::
```
</br>

## 🚀 How to Access 
### 방법 1: 테스트 계정으로 바로 체험
| 항목 | 값 |
|:----:|:----:|
| 🖱️ | https://wearenaos.com/ |
| **ID** | `seed@naos.com` |
| **PW** | `seed1234!` |

### 방법 2: 직접 회원가입
| 단계 | 설명 |
|:----:|------|
| **1단계** | 회원가입 탭 선택 후 **이메일 주소** 입력 |
| **2단계** | 이메일로 발송된 **6자리 인증코드** 입력 (5분간 유효) |
| **3단계** | 서비스에서 사용할 **사용자명** 설정 |
| **4단계** | **비밀번호**(8~20자) 입력 후 가입 완료 |

<br/>

## 🧪 How to Test (레시피 업로드 테스트)

레시피 업로드 기능을 테스트할 수 있도록 **샘플 영상**을 제공합니다.

### 테스트 영상 다운로드
🔗 [Google Drive - 샘플 레시피 영상](https://drive.google.com/file/d/1nP9Uy3_xIGWhf6jVXSdcIAGmo6Dle08F/view?usp=sharing)

### 업로드 테스트 방법
| 단계 | 설명 |
|:----:|------|
| **1** | 위 링크에서 영상을 다운로드 |
| **2** | NAOS 로그인 후 하단 **'업로드'** 탭 선택 |
| **3** | 다운로드한 영상 파일 선택 |
| **4** | **Whisper AI**가 음성 분석하여 클립 자동 분할 (1~3분 소요) |
| **5** | 분할된 클립 확인/수정 후 **썸네일 선택** |
| **6** | 레시피 정보 입력 후 **'분석하기'** 클릭 → AI 가성비 점수 확인 |
| **7** | **'공유하기'** 버튼으로 업로드 완료 |

<br/>

## 📦 How to Install

### 1. 레포지토리 클론
```bash
git clone https://github.com/monimoni12/naos.git
cd naos
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
nano .env  # 실제 값 입력
```

### 3. Docker로 전체 실행
```bash
docker compose up --build -d
```

### 4. 접속
- Frontend: http://localhost:3000
- Backend: http://localhost:8090

</br>

## 🛠️ How to Build (로컬 환경 빌드)

### Prerequisites
- Java 17+
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- MySQL 8.0+

### Backend (Spring Boot)
```bash
cd be
./gradlew build
./gradlew bootRun
```

### Frontend (Next.js)
```bash
cd fe
npm install
npm run dev
```

### AI Server (Flask)
```bash
cd ai
pip install -r requirements.txt
python main.py
```

### Docker Compose (전체 실행)
```bash
docker compose up --build -d
```

<br/>
<br/>

# 1. Project Overview (프로젝트 개요)
### 프로젝트 이름: NAOS
### 프로젝트 설명:

**NAOS**는 요리와 영상의 병행이 어려운 문제를 해결하는  
**건강 맞춤 AI 레시피 추천 플랫폼**입니다.


Whisper 기반 영상 자동분할 기술을 최초로 적용하여,  
레시피 영상을 단계별로 자동 분리하고 각 단계를 **자동 반복재생**합니다.

- 🎬 **Whisper 기반 영상 자동분할**: 레시피 영상을 조리 단계별로 자동 분리
- 💰 **AI 가성비 점수**: GPT가 가격·영양·시간을 분석해 0~100점 산출
- 🥗 **건강 맞춤 필터**: 저탄수화물, 고단백 등 카테고리별 검색
- 👥 **SNS형 커뮤니티**: 팔로우, 좋아요, 댓글, 스크랩 기능

> 20~34세 MZ세대의 '헬시 플레저' 라이프스타일을 위한  
> 새로운 요리 경험을 제공합니다.

<br/>
<br/>

## 2. 문제 정의
> 왜 NAOS인가? 기존 요리 경험의 4대 문제점

### “헬시 플레저 + 요리 영상 시장의 폭발적 성장”: 시장분석
- MZ 중심 헬시 플레저 소비 증가
- 요리 영상 소비 증가(TikTok·Instagram Reels 트렌드)
- “집밥 재발견” 트렌드
- 홈트 + 홈쿡 동시 성장
- YouTube/Instagram은 ‘보기 좋은 콘텐츠’는 많지만 ‘따라하기 쉬운 콘텐츠’는 부족

### 문제 1 — 요리 중 영상 병행 어려움
- 화면 꺼짐
- 영상 진행 속도와 조리 속도 불일치
- 손이 젖어 있어 조작 불편
- 뒤로 가기 시 다른 영상으로 넘어가는 UX 문제

### 문제 2 — 다이어트 지속의 어려움
- 건강 기준이 사람마다 다름
- 명확한 ‘맞춤형 건강 레시피’가 존재하지 않음

### 문제 3 — 비용·재료 구매의 부담
- “이 요리 만드는 데 얼마 들지?” 감이 없음
- 초보자일수록 장벽이 큼

### 문제 4 — 정보 과잉, 개인에게 맞지 않는 레시피 난립
- 유튜브·블로그에 ‘나에게 맞지 않는 정보’가 너무 많음
- 체계적 큐레이션 없음

<br/>
</br>

## 3. Key Features (주요 기능)

## 🎬 Whisper 기반 영상 자동분할
- 레시피 영상 업로드 시 **OpenAI Whisper**가 음성을 분석
- 문장별 타임스탬프를 추출하여 **조리 단계별 자동 분리**
- 각 단계는 사용자가 넘길 때까지 **자동 반복재생**
- 요리 중 손이 젖어도, 영상이 빨리 지나가도 걱정 없음

## 💰 AI 가성비 점수
- GPT가 레시피의 **재료 가격, 영양 구성, 조리 시간**을 종합 분석
- **0~100점**의 가성비 점수 산출
  - 가격 효율성 35%
  - 시간 효율성 25%
  - 영양 균형 25%
  - 재료 접근성 15%
- 레시피 카드에 **배지 형태**로 표시
- **가성비순 정렬** 필터 제공

## 🥗 건강 맞춤 필터
- **카테고리**: 저탄수화물, 고단백, 반찬, 간식
- **난이도**: 쉬움, 보통, 어려움
- **최대 가격**: 0원 ~ 50,000원
- **최대 조리 시간**: 0분 ~ 120분

## 👥 SNS형 커뮤니티
- **팔로우**: 다른 사용자 팔로우 및 팔로잉 피드
- **좋아요**: 실시간 좋아요 수 반영
- **댓글/대댓글**: WebSocket 기반 실시간 댓글
- **책갈피**: 레시피 스크랩 및 프로필에서 확인

## 🍳 요리 진행 추적
- **요리 시작하기** 버튼으로 단계별 체크
- 진행 상황 **서버 자동 저장**
- 중단 후 이어서 진행 가능
- 프로필의 **'요리중' 탭**에서 확인

<br/>
<br/>

## 4. 기존연구와의 비교

 |NAOS|케토 다이어트 - 만개의 레시피|youtube|
 |:------:|:------:|:------:|
 |<img width="963" height="413" alt="제목 없는 디자인" src="https://github.com/user-attachments/assets/35d43e51-0e78-4ff6-b942-54e704349e0d" />|<img width="300" alt="image" src="https://github.com/user-attachments/assets/0c28c36e-69f8-4059-9a3f-9bc48ea28f38" />|<img width="150" alt="image" src="https://github.com/user-attachments/assets/36c74122-a0f1-46da-9e11-cace73b950d1" />|
 |저탄고지뿐 아니라 저염, 고단백, 가성비 레시피까지 다양한 다이어트 유형 지원| 케토 중심이라 식단 범위가 좁음 → 건강한 체중감량 식단은 키토 말고도 다양하게 존재하며, 탄수화물 제한이 어려운 사람이 존재하는 등 부작용이 있을 수 있음. |---|
 |모든 기능을 무료로 제공| 구독료와 프리미엄 콘텐츠 요금 모두 있는 점을 확인. 주머니 사정이 넉넉치 않거나 지불 용의가 없는 사용자에게는 부담이 될 수밖에 없음 |---|
 |사용자들이 레시피를 창출하고 사용자 간 동기부여·경험 공유 등을 통해 자유롭게 교류할 수 있도록 함|커뮤니티/사용자 참여 기능이 제한적. 따라서 사용자 간 경험 공유·실행 기록 가능성이 미비.|△|
 |요리 최적화 기능: 단계별 북마크, “다음 단계” 버튼의 실행 보조 기능을 제공하여 조리가 편리하도록 함|손쉽게 요리할 수 있도록 돕는 조리 실행 보조 기능이 미흡|요리에 최적화되어 있지 않음.|

</br>
</br>

### 5. 기대 효과 및 의의

NAOS는 다음과 같은 기대효과를 제공합니다.

### ✅ 지속 가능한 식단 루틴 구축
커뮤니티 구조가 **사용자 간 동기부여**를 만들고, 가성비 중심 정보가 축적되며 **선순환**을 일으킵니다.
- 팔로우/좋아요/댓글을 통한 상호 격려
- 다른 사용자의 성공 레시피 참고 가능

### ✅ 따라 하기 쉬운 레시피 경험
레시피가 **단계별로 구조화**되고 클립 반복 기능이 있어, **요리 병행에 최적화**되어 있습니다.
- Whisper 자동분할로 영상이 1단계·2단계·3단계로 분리
- 각 단계 자동 반복재생 → 요리 중 영상 조작 불필요
- 유튜브처럼 뒤로 돌려보는 불편함 해소

### ✅ 건강한 식단 선택의 장벽 낮춤
**가격·영양·시간**을 한눈에 비교할 수 있어, 사용자가 **즉시 더 나은 선택**을 하도록 돕습니다.
- AI 가성비 점수로 효율적인 레시피 즉시 파악
- 필터로 예산/시간/건강 목표에 맞는 레시피 검색
- "이 요리 만드는 데 얼마 들지?" 고민 해결

<br/>
<br/>

## 6. Project Design
## 요구사항 정의
### 기술 스펙
| 분류 | 기술 스택 |
|------|-----------|
| **Frontend** | ![React](https://img.shields.io/badge/react-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) |
| **Backend** | ![Spring Boot](https://img.shields.io/badge/springboot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white) ![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white) ![MySQL](https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white) |
| **DevOps / Infra** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Amazon EC2](https://img.shields.io/badge/Amazon%20EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white) ![Amazon S3](https://img.shields.io/badge/Amazon%20S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white) ![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white) ![Terraform](https://img.shields.io/badge/Terraform-844FBA?style=for-the-badge&logo=terraform&logoColor=white) |
| **AI** | ![Python Flask Microservice](https://img.shields.io/badge/Microservice-Flask-blue?style=for-the-badge&logo=flask&logoColor=white) |
| **Documentation/Test** | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white) |

</br>
</br>

## 7. Project Structure (프로젝트 구조)

## 7.1 Backend
```plaintext
be/ (Backend - Spring Boot)
└── src/
    ├── main/
    │   ├── java/com/naos/
    │   │   ├── domain/
    │   │   │   ├── auth/           # 인증/인가 (JWT, 이메일 인증)
    │   │   │   │   ├── controller/
    │   │   │   │   ├── service/
    │   │   │   │   ├── dto/
    │   │   │   │   └── entity/
    │   │   │   ├── user/           # 사용자 관리
    │   │   │   ├── recipe/         # 레시피 CRUD
    │   │   │   ├── feed/           # 홈 피드 & 필터
    │   │   │   ├── comment/        # 댓글/대댓글
    │   │   │   ├── like/           # 좋아요
    │   │   │   ├── bookmark/       # 책갈피(스크랩)
    │   │   │   ├── follow/         # 팔로우/팔로잉
    │   │   │   └── cooking/        # 요리 진행 추적
    │   │   │
    │   │   └── global/
    │   │       ├── config/         # Spring 설정 (Security, WebSocket, Redis)
    │   │       ├── exception/      # 전역 예외 처리
    │   │       ├── init/           # 시드 데이터 초기화
    │   │       ├── aws/            # S3 Presigned URL
    │   │       └── websocket/      # WebSocket + Redis Pub/Sub
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── application-prod.yml
    │
    └── Dockerfile
```
<br/>

## 7.2 Frontend
```plaintext
fe/ (Frontend - Next.js)
└── src/
    ├── app/                        # Next.js App Router
    │   ├── layout.tsx
    │   ├── page.tsx                # 홈 피드
    │   ├── (auth)/                 # 인증 (로그인/회원가입)
    │   ├── (main)/                 # 메인 레이아웃
    │   │   ├── feed/               # 피드 페이지
    │   │   ├── recipe/[id]/        # 레시피 상세
    │   │   ├── upload/             # 레시피 업로드
    │   │   ├── profile/            # 프로필
    │   │   └── following/          # 팔로잉 피드
    │   │
    ├── features/                   # 도메인별 로직
    │   ├── auth/                   # 인증 관련
    │   ├── recipe/                 # 레시피 관련
    │   ├── feed/                   # 피드 관련
    │   ├── comment/                # 댓글 관련
    │   └── upload/                 # 업로드 관련 (Whisper 연동)
    │
    ├── components/                 # 공통 컴포넌트
    ├── hooks/                      # 커스텀 훅
    ├── lib/                        # 유틸리티 (axios, etc)
    └── constants/                  # 상수 정의
```
<br/>

## 7.3 AI Server
```plaintext
ai/ (AI Server - Flask)
└── app/
    ├── main.py                     # Flask 앱 엔트리포인트
    ├── routes/
    │   ├── whisper.py              # Whisper STT API
    │   └── analysis.py             # GPT 가성비 분석 API
    ├── services/
    │   ├── whisper_service.py      # Whisper 음성→텍스트 변환
    │   └── gpt_service.py          # GPT 가성비 점수 산출
    └── Dockerfile
```
<br/>

## 7.4 Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│    Nginx    │────▶│   Next.js   │
│  (Browser)  │     │  (Reverse   │     │  (Frontend) │
└─────────────┘     │   Proxy)    │     └─────────────┘
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Spring Boot │     │    Flask    │     │    Redis    │
│  (Backend)  │◀───▶│ (AI Server) │     │  (Pub/Sub)  │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│    MySQL    │     │  OpenAI API │
│ (Database)  │     │  (Whisper,  │
└─────────────┘     │    GPT)     │
                    └─────────────┘
       │
       ▼
┌─────────────┐
│  Amazon S3  │
│  (Storage)  │
└─────────────┘
```

<br/>
<br/>


## 전체시스템 구성
<img width="2400" height="1350" alt="naos sw 구조도" src="https://github.com/user-attachments/assets/5d3d4e23-8670-48f1-a0fe-90b3a1a150cf" />

