package com.pms.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerDTO {
    private String userId;
    private String name;
    private String englishName;
    private String email;
    private String title;
}
