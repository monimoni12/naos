package com.moni.naos.domain.reward.repository;

import com.moni.naos.domain.reward.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * BadgeRepository
 * - 배지 정의 관리 (예: 100레시피 업로드 등)
 */
public interface BadgeRepository extends JpaRepository<Badge, Long> {}
