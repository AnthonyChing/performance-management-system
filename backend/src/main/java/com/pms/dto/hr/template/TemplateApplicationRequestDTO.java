package com.pms.dto.hr.template;

import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TemplateApplicationRequestDTO {
    private List<UUID> targetDepartments;
    private List<String> targetJobLevels;
}
