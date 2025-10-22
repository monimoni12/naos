package com.moni.naos.domain.ai.repository;

import com.moni.naos.domain.ai.entity.AiJob;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * AiJobRepository
 * - AI 요청(스크립트 생성 등) 작업 관리
 */
public interface AiJobRepository extends JpaRepository<AiJob, Long> {}
