package com.pms.entity;

import com.pms.entity.converter.EmploymentStatusConverter;
import com.pms.entity.enums.EmploymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "employee_id", nullable = false, unique = true)
    private String employeeId;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "english_name")
    private String englishName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "job_category", nullable = false)
    private String jobCategory;

    @Column(name = "location")
    private String location;

    @Convert(converter = EmploymentStatusConverter.class)
    @Column(
            name = "employment_status",
            nullable = false,
            columnDefinition = "employment_status_enum")
    private EmploymentStatus employmentStatus;

    @Column(name = "terminated_at")
    private OffsetDateTime terminatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
