package com.pms.dto.employee;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {
    private String userId;
    private String employeeId;
    private String name;
    private String englishName;
    private String avatarUrl;
    private String jobTitle;
    private String jobCategory;
    private DepartmentDTO department;
    private String location;
    private String email;
    private String employmentStatus;
    private OffsetDateTime terminatedAt;
    private ManagerDTO manager;
}
