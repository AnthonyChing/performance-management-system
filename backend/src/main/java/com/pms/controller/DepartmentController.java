package com.pms.controller;

import com.pms.dto.DepartmentResponse;
import com.pms.service.DepartmentService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Departments are provisioned externally (HR source-of-truth) and seeded into
// this database; this service exposes read-only access only.
@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    private final DepartmentService service;

    public DepartmentController(DepartmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<DepartmentResponse> list(
            @RequestParam(defaultValue = "false") boolean includeClosed) {
        return service.listAll(includeClosed).stream().map(DepartmentResponse::from).toList();
    }

    @GetMapping("/{id}")
    public DepartmentResponse get(@PathVariable UUID id) {
        return DepartmentResponse.from(service.get(id));
    }
}
