package com.moni.naos.domain.user.entity;

import com.moni.naos.global.jpa.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "roles",
        uniqueConstraints = @UniqueConstraint(name = "uq_role_name", columnNames = "name"))
public class Role extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ROLE_USER / ROLE_ADMIN 등 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoleName name;

    @Column(length = 200)
    private String description;

    public enum RoleName {
        ROLE_USER,
        ROLE_ADMIN
    }
}
