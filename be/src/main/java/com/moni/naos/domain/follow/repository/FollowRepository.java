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

    List<Follow> findByFollower(User follower);  // 내가 팔로우한 사람 목록
    List<Follow> findByFollowee(User followee);  // 나를 팔로우한 사람 목록

    // 이미 팔로우 관계가 존재하는지 여부
    boolean existsByFollowerAndFollowee(User follower, User followee);

    // 언팔로우 시 필요할 수 있음
    void deleteByFollowerAndFollowee(User follower, User followee);
}
