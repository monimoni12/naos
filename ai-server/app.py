"""
NAOS AI Server
- Whisper STT: 영상 음성 → 텍스트 전사
- GPT 가성비 분석: 레시피 → 점수 계산

엔드포인트:
- GET  /health
- POST /api/whisper/transcribe        (기본 전사)
- POST /api/whisper/transcribe-save   (전사 + Spring 저장)
- POST /api/gpt/cost-analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import time
import requests as http_requests

# 환경변수 로드
load_dotenv()

# 서비스 임포트
from services.whisper_service import WhisperService
from services.gpt_service import GptService

app = Flask(__name__)
CORS(app)  # Spring에서 호출 허용

# 서비스 초기화
whisper_service = WhisperService()
gpt_service = GptService()

# Spring 서버 URL (환경변수 또는 기본값)
SPRING_BASE_URL = os.getenv('SPRING_BASE_URL', 'http://localhost:8090')


@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({
        "status": "ok",
        "message": "NAOS AI Server is running",
        "demucs_enabled": whisper_service.use_demucs
    })


# ==================== Whisper STT ====================

@app.route('/api/whisper/transcribe', methods=['POST'])
def transcribe():
    """
    Whisper STT - 영상/음성 → 텍스트 전사
    
    Request:
        {
            "videoUrl": "https://s3.../video.mp4",
            "language": "ko"
        }
    
    Response (Spring TranscriptSaveRequest 호환):
        {
            "fullText": "전체 텍스트",
            "segments": [
                {"index": 0, "start": 0.0, "end": 5.2, "text": "안녕하세요"}
            ],
            "language": "ko",
            "duration": 120.5,
            "processingTime": 3.5
        }
    """
    try:
        start_time = time.time()
        data = request.get_json()
        
        video_url = data.get('videoUrl')
        language = data.get('language', 'ko')
        
        if not video_url:
            return jsonify({"error": "videoUrl이 필요합니다."}), 400
        
        # Whisper 호출
        result = whisper_service.transcribe_url(video_url)
        
        processing_time = round(time.time() - start_time, 2)
        
        # duration 결정 (ffprobe > Whisper 감지)
        duration = result.get('duration') or result.get('detected_duration')
        
        return jsonify({
            "fullText": result.get('full_text', ''),
            "segments": result.get('segments', []),
            "language": language,
            "duration": duration,
            "processingTime": processing_time
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/whisper/transcribe-save', methods=['POST'])
def transcribe_and_save():
    """
    Whisper STT + Spring 저장
    전사 완료 후 Spring /api/transcripts/{recipeId} 에 자동 저장
    
    Request:
        {
            "videoUrl": "https://s3.../video.mp4",
            "recipeId": 123,
            "language": "ko",
            "springUrl": "http://localhost:8080"  (선택, 기본값 사용)
        }
    
    Response:
        {
            "success": true,
            "recipeId": 123,
            "segmentCount": 30,
            "springResponse": { ... }
        }
    """
    try:
        start_time = time.time()
        data = request.get_json()
        
        video_url = data.get('videoUrl')
        recipe_id = data.get('recipeId')
        language = data.get('language', 'ko')
        spring_url = data.get('springUrl', SPRING_BASE_URL)
        
        if not video_url:
            return jsonify({"error": "videoUrl이 필요합니다."}), 400
        if not recipe_id:
            return jsonify({"error": "recipeId가 필요합니다."}), 400
        
        # Step 1: Spring에 전사 시작 알림
        try:
            http_requests.post(
                f"{spring_url}/api/transcripts/{recipe_id}/start",
                timeout=5
            )
        except:
            pass  # 실패해도 계속 진행
        
        # Step 2: Whisper 전사
        try:
            result = whisper_service.transcribe_url(video_url)
        except Exception as e:
            # 실패 시 Spring에 알림
            _notify_spring_failed(spring_url, recipe_id, str(e))
            raise e
        
        # Step 3: 결과 검증
        segments = result.get('segments', [])
        full_text = result.get('full_text', '')
        duration = result.get('duration') or result.get('detected_duration')
        
        # 음성이 없는 경우 판단 (세그먼트가 없거나 텍스트가 너무 짧음)
        if not segments or len(full_text) < 10:
            _notify_spring_no_audio(spring_url, recipe_id)
            return jsonify({
                "success": False,
                "recipeId": recipe_id,
                "reason": "no_audio",
                "message": "영상에 음성이 감지되지 않았습니다."
            })
        
        # Step 4: Spring에 전사 결과 저장
        spring_payload = {
            "fullText": full_text,
            "segments": segments,
            "language": language,
            "duration": duration
        }
        
        spring_response = http_requests.post(
            f"{spring_url}/api/transcripts/{recipe_id}",
            json=spring_payload,
            timeout=30
        )
        
        processing_time = round(time.time() - start_time, 2)
        
        if spring_response.status_code == 200:
            return jsonify({
                "success": True,
                "recipeId": recipe_id,
                "segmentCount": len(segments),
                "duration": duration,
                "processingTime": processing_time,
                "springResponse": spring_response.json()
            })
        else:
            return jsonify({
                "success": False,
                "recipeId": recipe_id,
                "error": f"Spring 저장 실패: {spring_response.status_code}",
                "springError": spring_response.text[:500]
            }), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _notify_spring_failed(spring_url: str, recipe_id: int, error_msg: str):
    """Spring에 전사 실패 알림"""
    try:
        http_requests.post(
            f"{spring_url}/api/transcripts/{recipe_id}/fail",
            json={"error": error_msg},
            timeout=5
        )
    except:
        pass


def _notify_spring_no_audio(spring_url: str, recipe_id: int):
    """Spring에 음성 없음 알림"""
    try:
        http_requests.post(
            f"{spring_url}/api/transcripts/{recipe_id}/no-audio",
            timeout=5
        )
    except:
        pass


# ==================== GPT 가성비 분석 ====================

@app.route('/api/gpt/cost-analysis', methods=['POST'])
def analyze_cost():
    """
    GPT 가성비 + 영양 분석 - 레시피 데이터 → 가성비 점수 + 영양 정보
    
    ⭐ 수정: analyze_cost_efficiency() → analyze_recipe_full()
    
    Request (Spring CostAnalysisRequest):
        {
            "recipeId": 1,
            "title": "다이어트 볶음밥",
            "ingredients": [
                {"name": "현미밥", "quantity": "1", "unit": "공기", "estimatedPrice": 1000}
            ],
            "cookingTimeMinutes": 15,
            "difficulty": "EASY",
            "caloriesPerServing": 350
        }
    
    Response (Spring CostAnalysisResult - 영양 정보 포함):
        {
            "recipeId": 1,
            "overallScore": 85,
            "breakdown": {
                "priceEfficiency": 90,
                "timeEfficiency": 85,
                "nutritionBalance": 80,
                "ingredientAccessibility": 85
            },
            "estimatedTotalCost": 2100,
            "comment": "가격 대비 영양가가 높고...",
            "nutrition": {
                "kcalEstimate": 450,
                "proteinG": 35,
                "carbsG": 45,
                "fatG": 10,
                "fiberG": 5,
                "sodiumMg": 600
            }
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "레시피 데이터가 필요합니다."}), 400
        
        # Spring 형식 → 내부 형식 변환
        ingredients = []
        total_price = 0
        
        for ing in data.get('ingredients', []) or []:
            price = ing.get('estimatedPrice', 0) or 0
            total_price += price
            ingredients.append({
                "name": ing.get('name', ''),
                "amount": f"{ing.get('quantity', '')} {ing.get('unit', '')}".strip(),
                "price": price
            })
        
        internal_request = {
            "recipe_id": data.get('recipeId'),
            "title": data.get('title', '레시피'),
            "ingredients": ingredients,
            "cook_time_min": data.get('cookingTimeMinutes', 0),
            "servings": 1,
            "kcal_estimate": data.get('caloriesPerServing', 0),
            "difficulty": data.get('difficulty')
        }
        
        # ⭐ 변경: analyze_cost_efficiency → analyze_recipe_full
        # 가성비 + 영양 정보를 한 번에 분석
        result = gpt_service.analyze_recipe_full(internal_request)
        
        # cost_efficiency 추출
        cost_efficiency = result.get('cost_efficiency', {})
        breakdown = cost_efficiency.get('breakdown', {})
        
        # nutrition 추출 (snake_case → camelCase 변환)
        nutrition_raw = result.get('nutrition', {})
        
        # Spring CostAnalysisResult 형식으로 변환
        response = {
            "recipeId": data.get('recipeId'),
            "overallScore": cost_efficiency.get('score', 0),
            "breakdown": {
                "priceEfficiency": breakdown.get('price_efficiency', 0),
                "timeEfficiency": breakdown.get('time_efficiency', 0),
                "nutritionBalance": breakdown.get('nutrition_balance', 0),
                "ingredientAccessibility": breakdown.get('accessibility', 0)
            },
            "estimatedTotalCost": cost_efficiency.get('estimated_total_price', total_price),
            "comment": cost_efficiency.get('summary', ''),
            # ⭐ 추가: 영양 정보 (camelCase로 변환)
            "nutrition": {
                "kcalEstimate": nutrition_raw.get('kcal_estimate', 0),
                "proteinG": nutrition_raw.get('protein_g', 0),
                "carbsG": nutrition_raw.get('carbs_g', 0),
                "fatG": nutrition_raw.get('fat_g', 0),
                "fiberG": nutrition_raw.get('fiber_g', 0),
                "sodiumMg": nutrition_raw.get('sodium_mg', 0)
            }
        }
        
        # 디버깅 로그
        print(f"[DEBUG] Flask 응답: overallScore={response['overallScore']}")
        print(f"[DEBUG] breakdown: {response['breakdown']}")
        print(f"[DEBUG] nutrition: {response['nutrition']}")
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==================== 기존 엔드포인트 (하위 호환) ====================

@app.route('/api/stt', methods=['POST'])
def speech_to_text_legacy():
    """기존 STT 엔드포인트 (하위 호환)"""
    try:
        if 'file' in request.files:
            file = request.files['file']
            result = whisper_service.transcribe_file(file)
            return jsonify({"success": True, **result})
        
        data = request.get_json()
        if data and 'url' in data:
            result = whisper_service.transcribe_url(data['url'])
            return jsonify({"success": True, **result})
        
        return jsonify({"success": False, "error": "file 또는 url이 필요합니다."}), 400
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/analyze/cost', methods=['POST'])
def analyze_cost_legacy():
    """기존 가성비 분석 엔드포인트 (하위 호환)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "레시피 데이터가 필요합니다."}), 400
        
        result = gpt_service.analyze_cost_efficiency(data)
        return jsonify({"success": True, "recipe_id": data.get('recipe_id'), **result})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/analyze/nutrition', methods=['POST'])
def analyze_nutrition():
    """영양 분석"""
    try:
        data = request.get_json()
        
        if not data or 'ingredients' not in data:
            return jsonify({"success": False, "error": "ingredients가 필요합니다."}), 400
        
        result = gpt_service.analyze_nutrition(data['ingredients'])
        return jsonify({"success": True, **result})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    
    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                 NAOS AI Server Started!                       ║
    ║                                                               ║
    ║   http://localhost:{port}                                      ║
    ║                                                               ║
    ║   Spring 연동 엔드포인트:                                      ║
    ║   - GET  /health                                              ║
    ║   - POST /api/whisper/transcribe        (전사만)              ║
    ║   - POST /api/whisper/transcribe-save   (전사 + Spring 저장)  ║
    ║   - POST /api/gpt/cost-analysis         (가성비 + 영양 분석)  ║
    ║                                                               ║
    ║   Demucs: {'✅ 활성화' if whisper_service.use_demucs else '❌ 비활성화'}                                        ║
    ║   Spring URL: {SPRING_BASE_URL}                     ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
