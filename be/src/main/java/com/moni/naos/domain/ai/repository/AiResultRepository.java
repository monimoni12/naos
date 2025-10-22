package com.moni.naos.domain.ai.repository;

import com.moni.naos.domain.ai.entity.AiResult;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * AiResultRepository
 * - AI 결과(JSON, 메타) 저장
 */
public interface AiResultRepository extends JpaRepository<AiResult, Long> {}
