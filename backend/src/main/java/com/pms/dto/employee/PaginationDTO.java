package com.pms.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginationDTO {
    private Integer page;
    private Integer pageSize;
    private Integer totalPages;
    private Integer totalCount;
    private Boolean hasPrevious;
    private Boolean hasNext;
}
