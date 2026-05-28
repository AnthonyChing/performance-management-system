package com.pms.dto.hr.evaluation;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmployeeGroupDto {
    private String groupId;
    private String groupType;
    private String name;
    private String description;
}
