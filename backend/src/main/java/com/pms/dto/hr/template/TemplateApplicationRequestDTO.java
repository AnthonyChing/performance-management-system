package com.pms.dto.hr.template;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor
public class TemplateApplicationRequestDTO {
    private List<UUID> targetDepartments;
    private List<String> targetJobLevels;
}
