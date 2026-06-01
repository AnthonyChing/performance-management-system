package com.pms.dto.manager.appeal;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ManagerAppealPatchRequestDTO {
    @NotBlank private String responseText;
    private Boolean isFinal;
    /** "approved" or "rejected" — required when isFinal is true */
    private String outcome;
}
