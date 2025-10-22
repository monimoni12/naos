package com.moni.naos.global.jpa;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;

@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @CreatedDate @Column(nullable=false, updatable=false) protected Instant createdAt;
    @LastModifiedDate @Column(nullable=false)              protected Instant updatedAt;
}
