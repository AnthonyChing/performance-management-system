package com.pms.service;

import com.pms.entity.Department;
import com.pms.exception.NotFoundException;
import com.pms.repository.DepartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository repository;

    @InjectMocks
    private DepartmentService departmentService;

    private Department activeDept;
    private Department closedDept;

    @BeforeEach
    void setUp() {
        activeDept = new Department();
        activeDept.setId(UUID.randomUUID());
        activeDept.setName("Engineering");

        closedDept = new Department();
        closedDept.setId(UUID.randomUUID());
        closedDept.setName("Old Sales");
        closedDept.setClosedAt(OffsetDateTime.now());
    }

    @Test
    void listAll_IncludeClosed_ReturnsAll() {
        when(repository.findAll()).thenReturn(Arrays.asList(activeDept, closedDept));

        List<Department> result = departmentService.listAll(true);

        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
        verify(repository, never()).findAllByClosedAtIsNull();
    }

    @Test
    void listAll_ExcludeClosed_ReturnsOnlyActive() {
        when(repository.findAllByClosedAtIsNull()).thenReturn(List.of(activeDept));

        List<Department> result = departmentService.listAll(false);

        assertEquals(1, result.size());
        assertEquals("Engineering", result.get(0).getName());
        verify(repository, times(1)).findAllByClosedAtIsNull();
        verify(repository, never()).findAll();
    }

    @Test
    void get_ExistingId_ReturnsDepartment() {
        UUID id = activeDept.getId();
        when(repository.findById(id)).thenReturn(Optional.of(activeDept));

        Department result = departmentService.get(id);

        assertNotNull(result);
        assertEquals("Engineering", result.getName());
        verify(repository, times(1)).findById(id);
    }

    @Test
    void get_NonExistingId_ThrowsNotFoundException() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        NotFoundException exception = assertThrows(NotFoundException.class, () -> {
            departmentService.get(id);
        });

        assertTrue(exception.getMessage().contains("department not found"));
        verify(repository, times(1)).findById(id);
    }
}
