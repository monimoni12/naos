package com.moni.naos.domain.follow.repository;

import com.moni.naos.domain.follow.entity.Follow;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * FollowRepository
 * - 유저 간 팔로우/언팔로우/목록 조회 처리
 */
public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByFollowerAndFollowing(User follower, User following);
    List<Follow> findByFollower(User follower);
    List<Follow> findByFollowing(User following);
    void deleteByFollowerAndFollowing(User follower, User following);
}
