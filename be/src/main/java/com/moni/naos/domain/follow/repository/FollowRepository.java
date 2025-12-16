package com.moni.naos.domain.follow.repository;

import com.moni.naos.domain.follow.entity.Follow;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * FollowRepository
 * - 유저 간 팔로우/언팔로우/목록 조회 처리
 */
public interface FollowRepository extends JpaRepository<Follow, Long> {

    /** 내가 팔로우한 사람 목록 */
    List<Follow> findByFollower(User follower);

    /** 나를 팔로우한 사람 목록 */
    List<Follow> findByFollowee(User followee);

    /** 팔로우 관계 존재 여부 */
    boolean existsByFollowerAndFollowee(User follower, User followee);

    /** 언팔로우 */
    void deleteByFollowerAndFollowee(User follower, User followee);

    /** 팔로워 수 (나를 팔로우하는 사람 수) */
    long countByFollowee(User followee);

    /** 팔로잉 수 (내가 팔로우하는 사람 수) */
    long countByFollower(User follower);

    /** 내가 팔로우하는 사람들의 ID 목록 (피드용) */
    @Query("SELECT f.followee.id FROM Follow f WHERE f.follower = :follower")
    List<Long> findFolloweeIdsByFollower(@Param("follower") User follower);

    /** 나를 팔로우하는 사람들의 ID 목록 */
    @Query("SELECT f.follower.id FROM Follow f WHERE f.followee = :followee")
    List<Long> findFollowerIdsByFollowee(@Param("followee") User followee);
}
