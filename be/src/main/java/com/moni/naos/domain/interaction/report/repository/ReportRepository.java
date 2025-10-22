package com.moni.naos.domain.interaction.report.repository;

import com.moni.naos.domain.interaction.report.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * ReportRepository
 * - 신고/모더레이션 엔티티 저장용
 */
public interface ReportRepository extends JpaRepository<Report, Long> {}
