package com.moni.naos.domain.reward.repository;

import com.moni.naos.domain.reward.entity.UserBadge;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * UserBadgeRepository
 * - 유저별 달성 배지 목록
 */
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUser(User user);
}
