package com.moni.naos.domain.reward.repository;

import com.moni.naos.domain.reward.entity.RewardTier;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * RewardTierRepository
 * - 브론즈/실버/골드 등 등급 테이블
 */
public interface RewardTierRepository extends JpaRepository<RewardTier, Long> {}
