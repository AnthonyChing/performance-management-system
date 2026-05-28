package com.pms.repository;

import com.pms.entity.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    @Query(
            value =
                    """
            SELECT r.name FROM roles r
            JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = :userId
            """,
            nativeQuery = true)
    List<String> findRoleNamesByUserId(@Param("userId") UUID userId);

    @Query(
            value =
                    "SELECT DISTINCT job_category FROM users WHERE job_category IS NOT NULL ORDER BY job_category",
            nativeQuery = true)
    List<String> findDistinctJobCategories();
}
