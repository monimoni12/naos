package com.moni.naos.domain.follow.service;

import com.moni.naos.domain.follow.dto.FollowUserResponse;
import com.moni.naos.domain.follow.entity.Follow;
import com.moni.naos.domain.follow.repository.FollowRepository;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.UserRepository;
import com.moni.naos.global.websocket.RedisPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * FollowService - 팔로우 비즈니스 로직
 * - Redis Pub/Sub으로 실시간 알림
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final RedisPublisher redisPublisher;  // ⭐ Redis

    /**
     * 팔로우 토글 (팔로우/언팔로우)
     */
    @Transactional
    public boolean toggle(Long userId, Long targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        User follower = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        User followee = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 유저를 찾을 수 없습니다."));

        boolean followed;
        if (followRepository.existsByFollowerAndFollowee(follower, followee)) {
            followRepository.deleteByFollowerAndFollowee(follower, followee);
            log.info("언팔로우: {} → {}", userId, targetUserId);
            followed = false;
        } else {
            Follow follow = Follow.builder()
                    .follower(follower)
                    .followee(followee)
                    .build();
            followRepository.save(follow);
            log.info("팔로우: {} → {}", userId, targetUserId);
            followed = true;
        }

        // ⭐ 실시간 알림 (팔로우 당한 사람에게)
        if (followed) {
            broadcastFollow(targetUserId, userId, follower);
        }

        return followed;
    }

    public boolean isFollowing(Long userId, Long targetUserId) {
        User follower = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        User followee = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 유저를 찾을 수 없습니다."));
        return followRepository.existsByFollowerAndFollowee(follower, followee);
    }

    public List<Long> getFollowerIds(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return followRepository.findFollowerIdsByFollowee(user);
    }

    public List<Long> getFollowingIds(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return followRepository.findFolloweeIdsByFollower(user);
    }

    public long getFollowerCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return followRepository.countByFollowee(user);
    }

    public long getFollowingCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return followRepository.countByFollower(user);
    }

    public List<FollowUserResponse> getFollowers(Long userId, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        User currentUser = currentUserId != null
                ? userRepository.findById(currentUserId).orElse(null)
                : null;

        return followRepository.findByFollowee(user).stream()
                .map(follow -> toFollowUserResponse(follow.getFollower(), currentUser))
                .collect(Collectors.toList());
    }

    public List<FollowUserResponse> getFollowing(Long userId, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        User currentUser = currentUserId != null
                ? userRepository.findById(currentUserId).orElse(null)
                : null;

        return followRepository.findByFollower(user).stream()
                .map(follow -> toFollowUserResponse(follow.getFollowee(), currentUser))
                .collect(Collectors.toList());
    }

    // ==================== Helper ====================

    private FollowUserResponse toFollowUserResponse(User user, User currentUser) {
        boolean isFollowing = false;
        if (currentUser != null && !currentUser.getId().equals(user.getId())) {
            isFollowing = followRepository.existsByFollowerAndFollowee(currentUser, user);
        }

        String fullName = null;
        String username = null;
        String profileUrl = null;

        if (user.getProfile() != null) {
            fullName = user.getProfile().getFullName();  // ⭐ 변경
            username = user.getProfile().getUsername();
            profileUrl = user.getProfile().getAvatarUrl();
        }

        return FollowUserResponse.builder()
                .userId(user.getId())
                .fullName(fullName)  // ⭐ 변경
                .username(username)
                .profileUrl(profileUrl)
                .isFollowing(isFollowing)
                .build();
    }

    /**
     * ⭐ Redis로 팔로우 알림 브로드캐스트
     */
    private void broadcastFollow(Long targetUserId, Long followerId, User follower) {
        String followerName = null;
        String followerUsername = null;
        String followerProfileUrl = null;

        if (follower.getProfile() != null) {
            followerName = follower.getProfile().getFullName();  // ⭐ 변경
            followerUsername = follower.getProfile().getUsername();
            followerProfileUrl = follower.getProfile().getAvatarUrl();
        }

        FollowNotification notification = new FollowNotification(
                targetUserId,
                followerId,
                followerName,
                followerUsername,
                followerProfileUrl,
                "FOLLOWED"
        );
        redisPublisher.publishNotification(targetUserId, notification);
    }

    public record FollowNotification(
            Long targetUserId,
            Long followerId,
            String followerName,
            String followerUsername,
            String followerProfileUrl,
            String type
    ) {}
}
