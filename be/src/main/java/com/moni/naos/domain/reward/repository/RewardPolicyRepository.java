package com.moni.naos.domain.reward.repository;

import com.moni.naos.domain.reward.entity.RewardPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * RewardPolicyRepository
 * - 행위별 점수정책 (예: 게시물 작성 +100)
 */
public interface RewardPolicyRepository extends JpaRepository<RewardPolicy, Long> {}
