package com.pms.service;

import com.pms.entity.Department;
import com.pms.exception.NotFoundException;
import com.pms.repository.DepartmentRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DepartmentService {

    private final DepartmentRepository repository;

    public DepartmentService(DepartmentRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Department> listAll(boolean includeClosed) {
        return includeClosed ? repository.findAll() : repository.findAllByClosedAtIsNull();
    }

    @Transactional(readOnly = true)
    public Department get(UUID id) {
        return repository
                .findById(id)
                .orElseThrow(() -> new NotFoundException("department not found: " + id));
    }
}
