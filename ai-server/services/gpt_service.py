"""
GPT Service
- 레시피 가성비 분석
- 영양 정보 추정
"""

import os
import json
from openai import OpenAI


class GptService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "gpt-4o-mini"  # 비용 효율적인 모델
    
    def analyze_cost_efficiency(self, recipe_data: dict) -> dict:
        """
        레시피 가성비 분석
        
        Args:
            recipe_data: {
                "title": "다이어트 볶음밥",
                "ingredients": [
                    {"name": "현미밥", "amount": "1공기", "price": 1000},
                    ...
                ],
                "cook_time_min": 15,
                "servings": 1,
                "kcal_estimate": 350
            }
        
        Returns:
            {
                "score": 85,
                "breakdown": {
                    "price_efficiency": 90,
                    "nutrition_balance": 80,
                    "time_efficiency": 85,
                    "accessibility": 85
                },
                "summary": "가격 대비 영양가가 높고..."
            }
        """
        prompt = self._build_cost_prompt(recipe_data)
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": """당신은 요리 레시피의 가성비를 분석하는 전문가입니다.
                    
주어진 레시피 정보를 바탕으로 가성비 점수를 0-100점으로 평가하세요.

평가 기준:
- price_efficiency (가격 효율성, 35%): 재료 가격 대비 영양가와 양
- nutrition_balance (영양 균형, 25%): 탄단지 비율, 영양소 다양성
- time_efficiency (시간 효율성, 25%): 조리 시간 대비 결과물 가치
- accessibility (재료 접근성, 15%): 재료 구하기 쉬운 정도

반드시 아래 JSON 형식으로만 응답하세요:
{
    "score": 종합점수(0-100),
    "breakdown": {
        "price_efficiency": 점수,
        "nutrition_balance": 점수,
        "time_efficiency": 점수,
        "accessibility": 점수
    },
    "summary": "한줄 평가"
}"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0,  # 일관성을 위해 0
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return self._normalize_score(result)
    
    def analyze_nutrition(self, ingredients: list) -> dict:
        """
        재료 기반 영양 정보 추정
        
        Args:
            ingredients: [
                {"name": "현미밥", "amount": "1공기"},
                {"name": "계란", "amount": "2개"}
            ]
        
        Returns:
            {
                "kcal_estimate": 450,
                "protein_g": 18,
                "carbs_g": 55,
                "fat_g": 12,
                "summary": "균형 잡힌 한 끼 식사입니다."
            }
        """
        ingredients_text = "\n".join([
            f"- {ing.get('name', '')}: {ing.get('amount', '')}"
            for ing in ingredients
        ])
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": """당신은 영양학 전문가입니다.
                    
주어진 재료 목록을 바탕으로 대략적인 영양 정보를 추정하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
    "kcal_estimate": 추정 칼로리(정수),
    "protein_g": 단백질(g),
    "carbs_g": 탄수화물(g),
    "fat_g": 지방(g),
    "fiber_g": 식이섬유(g),
    "sodium_mg": 나트륨(mg),
    "summary": "영양 평가 한줄 요약"
}"""
                },
                {
                    "role": "user",
                    "content": f"다음 재료로 만든 요리의 영양 정보를 추정해주세요:\n\n{ingredients_text}"
                }
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _build_cost_prompt(self, recipe_data: dict) -> str:
        """가성비 분석용 프롬프트 생성"""
        title = recipe_data.get('title', '레시피')
        ingredients = recipe_data.get('ingredients', [])
        cook_time = recipe_data.get('cook_time_min', 0)
        servings = recipe_data.get('servings', 1)
        kcal = recipe_data.get('kcal_estimate', 0)
        
        # 재료 목록 텍스트
        ingredients_text = ""
        total_price = 0
        for ing in ingredients:
            name = ing.get('name', '')
            amount = ing.get('amount', '')
            price = ing.get('price', 0)
            total_price += price
            ingredients_text += f"- {name}: {amount} (약 {price}원)\n"
        
        return f"""레시피: {title}

[재료]
{ingredients_text}
총 재료비: 약 {total_price}원

[정보]
- 조리 시간: {cook_time}분
- {servings}인분
- 예상 칼로리: {kcal}kcal

이 레시피의 가성비를 분석해주세요."""
    
    def _normalize_score(self, result: dict) -> dict:
        """점수를 0-100 범위로 정규화"""
        def clamp(value, min_val=0, max_val=100):
            try:
                return max(min_val, min(max_val, int(value)))
            except (ValueError, TypeError):
                return 50
        
        if 'score' in result:
            result['score'] = clamp(result['score'])
        
        if 'breakdown' in result:
            for key in result['breakdown']:
                result['breakdown'][key] = clamp(result['breakdown'][key])
        
        return result
