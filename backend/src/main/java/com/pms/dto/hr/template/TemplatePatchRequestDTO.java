package com.pms.dto.hr.template;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TemplatePatchRequestDTO {
    @Size(max = 255)
    private String name;

    private String description;
    private String jobCategory;
}
