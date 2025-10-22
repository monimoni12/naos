package com.moni.naos.domain.user.repository;

import com.moni.naos.domain.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * RoleRepository
 * - 권한 테이블 (USER, ADMIN 등)
 */
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
