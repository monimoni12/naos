package com.moni.naos.global.rsdata;

import lombok.*;

import java.util.List;

/**
 * CursorPage - 커서 기반 페이지네이션 응답
 * 
 * 무한 스크롤에 최적화된 페이지네이션
 * - offset보다 성능이 좋음 (뒤로 갈수록 느려지지 않음)
 * - 실시간 데이터 변경에도 중복/누락 없음
 * 
 * @param <T> 데이터 타입
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CursorPage<T> {

    /**
     * 데이터 목록
     */
    private List<T> content;
    
    /**
     * 다음 페이지 커서
     * null이면 마지막 페이지
     */
    private Long nextCursor;
    
    /**
     * 다음 페이지 존재 여부
     */
    private Boolean hasNext;
    
    /**
     * 현재 페이지 데이터 개수
     */
    private Integer size;
    
    /**
     * 전체 데이터 개수 (선택적, 성능상 필요시에만)
     */
    private Long totalCount;
    
    // ==================== 정적 팩토리 메서드 ====================
    
    /**
     * 데이터와 다음 커서로 생성
     */
    public static <T> CursorPage<T> of(List<T> content, Long nextCursor, boolean hasNext) {
        return CursorPage.<T>builder()
                .content(content)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .size(content.size())
                .build();
    }
    
    /**
     * 전체 개수 포함하여 생성
     */
    public static <T> CursorPage<T> of(List<T> content, Long nextCursor, boolean hasNext, Long totalCount) {
        return CursorPage.<T>builder()
                .content(content)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .size(content.size())
                .totalCount(totalCount)
                .build();
    }
    
    /**
     * 빈 페이지 생성
     */
    public static <T> CursorPage<T> empty() {
        return CursorPage.<T>builder()
                .content(List.of())
                .nextCursor(null)
                .hasNext(false)
                .size(0)
                .build();
    }
}
