package com.moni.naos.domain.interaction.report.repository;

import com.moni.naos.domain.interaction.report.entity.Report;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * ReportRepository
 * - 신고/모더레이션 엔티티 저장용
 */
public interface ReportRepository extends JpaRepository<Report, Long> {

    /** 중복 신고 체크 (같은 유저가 같은 대상을 이미 신고했는지) */
    boolean existsByReporterAndTargetTypeAndTargetId(User reporter, Report.TargetType targetType, Long targetId);

    /** 특정 대상의 신고 목록 */
    List<Report> findByTargetTypeAndTargetId(Report.TargetType targetType, Long targetId);

    /** 특정 대상의 신고 수 */
    long countByTargetTypeAndTargetId(Report.TargetType targetType, Long targetId);

    /** 상태별 신고 목록 (관리자용) */
    List<Report> findByStatusOrderByIdDesc(Report.Status status);

    /** 유저의 신고 내역 */
    List<Report> findByReporterOrderByIdDesc(User reporter);
}
