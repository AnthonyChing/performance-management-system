package com.pms.repository;

import com.pms.entity.Department;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    List<Department> findAllByClosedAtIsNull();
}
