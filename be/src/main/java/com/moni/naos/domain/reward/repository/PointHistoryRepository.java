package com.moni.naos.domain.reward.repository;

import com.moni.naos.domain.reward.entity.PointHistory;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * PointHistoryRepository
 * - 포인트 내역(적립/차감/잔액 스냅샷)
 */
public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {
    List<PointHistory> findByUserOrderByCreatedAtDesc(User user);
}
