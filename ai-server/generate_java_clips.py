"""
전사 결과 → RecipeDataInitializer Java 코드 변환

transcription_results.json을 읽어서
RecipeDataInitializer.java에 적용할 클립 데이터 생성

실행:
python generate_java_clips.py
"""

import json
import os


def split_into_clips(segments: list, num_clips: int = 3) -> list:
    """
    세그먼트를 N개 클립으로 분할
    
    Returns:
        [
            {"index": 0, "startSec": 0.0, "endSec": 45.0, "caption": "..."},
            {"index": 1, "startSec": 45.0, "endSec": 90.0, "caption": "..."},
            {"index": 2, "startSec": 90.0, "endSec": 135.0, "caption": "..."}
        ]
    """
    if not segments:
        return []
    
    total_segments = len(segments)
    
    if total_segments < num_clips:
        # 세그먼트가 클립 수보다 적으면 각각 클립으로
        clips = []
        for i, seg in enumerate(segments):
            clips.append({
                "index": i,
                "startSec": seg.get("start", 0),
                "endSec": seg.get("end", 0),
                "caption": seg.get("text", "")[:150]  # 150자 제한
            })
        return clips
    
    # 세그먼트를 N등분
    part_size = total_segments // num_clips
    clips = []
    
    for clip_idx in range(num_clips):
        if clip_idx == num_clips - 1:
            # 마지막 클립은 나머지 모두
            clip_segments = segments[clip_idx * part_size:]
        else:
            clip_segments = segments[clip_idx * part_size:(clip_idx + 1) * part_size]
        
        if not clip_segments:
            continue
        
        # 텍스트 합치기
        combined_text = " ".join(seg.get("text", "") for seg in clip_segments)
        combined_text = combined_text.strip()
        
        # 150자 제한
        if len(combined_text) > 150:
            combined_text = combined_text[:147] + "..."
        
        clips.append({
            "index": clip_idx,
            "startSec": clip_segments[0].get("start", 0),
            "endSec": clip_segments[-1].get("end", 0),
            "caption": combined_text
        })
    
    return clips


def escape_java_string(text: str) -> str:
    """Java 문자열 이스케이프"""
    return text.replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ').replace('\r', '')


def generate_clip_list(clips: list) -> str:
    """
    Java List.of(clip(...), clip(...), ...) 형식 생성
    """
    if not clips:
        return "List.of()"
    
    lines = ["List.of("]
    for i, clip in enumerate(clips):
        caption = escape_java_string(clip["caption"])
        start = clip["startSec"]
        end = clip["endSec"]
        idx = clip["index"]
        
        comma = "," if i < len(clips) - 1 else ""
        lines.append(f'                    clip({idx}, {start}, {end}, "{caption}"){comma}')
    
    lines.append("                )")
    return "\n".join(lines)


def main():
    input_file = "transcription_results.json"
    
    if not os.path.exists(input_file):
        print(f"❌ {input_file} 파일이 없습니다.")
        print("먼저 python transcribe_seed_videos.py 를 실행하세요.")
        return
    
    with open(input_file, "r", encoding="utf-8") as f:
        results = json.load(f)
    
    print("=" * 70)
    print("📝 전사 결과 → Java 클립 코드 변환")
    print("=" * 70)
    
    success_count = sum(1 for r in results if r.get("success") and r.get("segments"))
    print(f"전사 성공: {success_count}/18개 레시피\n")
    
    # ===== 1. 간단한 클립 목록 (clip_list.txt) =====
    clip_lines = []
    clip_lines.append("// =================================================")
    clip_lines.append("// RecipeDataInitializer - 전사된 클립 데이터")
    clip_lines.append("// transcription_results.json 기반 자동 생성")
    clip_lines.append("// =================================================\n")
    
    for recipe in results:
        name = recipe["name"]
        category = recipe["category"]
        
        if not recipe.get("success") or not recipe.get("segments"):
            clip_lines.append(f"// ⚠️ [{category}] {name} - 전사 실패 또는 세그먼트 없음\n")
            continue
        
        clips = split_into_clips(recipe["segments"], 3)
        
        clip_lines.append(f"// [{category}] {name}")
        clip_list_code = generate_clip_list(clips)
        clip_lines.append(clip_list_code)
        clip_lines.append("")
    
    with open("clip_list.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(clip_lines))
    print("✅ clip_list.txt 저장 완료")
    
    # ===== 2. 전체 createRecipe 호출 패턴 (clip_full.txt) =====
    full_lines = []
    full_lines.append("// =================================================")
    full_lines.append("// RecipeDataInitializer.java 전체 클립 데이터")
    full_lines.append("// 각 createRecipe() 호출의 마지막 파라미터로 사용")
    full_lines.append("// =================================================\n")
    
    # 카테고리별로 그룹화
    categories = {"LOSS": [], "GAIN": [], "BALANCE": [], "SNACK": []}
    
    for recipe in results:
        cat = recipe.get("category", "SNACK")
        if cat in categories:
            categories[cat].append(recipe)
    
    for cat, recipes in categories.items():
        full_lines.append(f"\n// ==================== {cat} ====================\n")
        
        for recipe in recipes:
            name = recipe["name"]
            idx = recipe["index"]
            
            if not recipe.get("success") or not recipe.get("segments"):
                full_lines.append(f"// [{idx}] {name} - 전사 실패")
                full_lines.append("// 기존 더미 데이터 유지 필요\n")
                continue
            
            clips = split_into_clips(recipe["segments"], 3)
            
            full_lines.append(f"// [{idx}] {name}")
            full_lines.append(f"// 세그먼트: {len(recipe['segments'])}개 → 클립 {len(clips)}개")
            
            clip_list_code = generate_clip_list(clips)
            full_lines.append(clip_list_code)
            full_lines.append("")
    
    with open("clip_full.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(full_lines))
    print("✅ clip_full.txt 저장 완료")
    
    # ===== 3. JSON 형식 (clips.json) =====
    clips_json = []
    for recipe in results:
        if not recipe.get("success") or not recipe.get("segments"):
            clips_json.append({
                "index": recipe["index"],
                "name": recipe["name"],
                "category": recipe["category"],
                "success": False,
                "clips": []
            })
            continue
        
        clips = split_into_clips(recipe["segments"], 3)
        clips_json.append({
            "index": recipe["index"],
            "name": recipe["name"],
            "category": recipe["category"],
            "success": True,
            "segmentCount": len(recipe["segments"]),
            "clips": clips
        })
    
    with open("clips.json", "w", encoding="utf-8") as f:
        json.dump(clips_json, f, ensure_ascii=False, indent=2)
    print("✅ clips.json 저장 완료")
    
    print()
    print("=" * 70)
    print("📂 생성된 파일:")
    print("   - clip_list.txt  : 클립 목록 (복사용)")
    print("   - clip_full.txt  : 카테고리별 전체 코드")
    print("   - clips.json     : JSON 형식 (프로그래밍용)")
    print("=" * 70)
    print()
    print("📋 적용 방법:")
    print("   1. clip_full.txt 열기")
    print("   2. 각 레시피의 List.of(clip(...), ...) 부분 복사")
    print("   3. RecipeDataInitializer.java의 해당 createRecipe() 호출에 붙여넣기")
    print("   4. Spring 서버 재시작")


if __name__ == "__main__":
    main()
