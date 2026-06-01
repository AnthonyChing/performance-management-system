package com.pms.entity.converter;

import static org.junit.jupiter.api.Assertions.*;

import com.pms.entity.enums.EmploymentStatus;
import com.pms.entity.enums.GoalReviewDecision;
import com.pms.entity.enums.IdentityProvider;
import org.junit.jupiter.api.Test;

class ConvertersTest {

    private final IdentityProviderConverter identityConverter = new IdentityProviderConverter();
    private final EmploymentStatusConverter employmentConverter = new EmploymentStatusConverter();
    private final GoalReviewDecisionConverter goalReviewConverter =
            new GoalReviewDecisionConverter();

    // ── IdentityProviderConverter ──────────────────────────────────────────────

    @Test
    void identityProvider_convertToDatabaseColumn_returnsDbValue() {
        assertEquals("google", identityConverter.convertToDatabaseColumn(IdentityProvider.GOOGLE));
        assertEquals(
                "azure_ad", identityConverter.convertToDatabaseColumn(IdentityProvider.AZURE_AD));
        assertEquals("okta", identityConverter.convertToDatabaseColumn(IdentityProvider.OKTA));
        assertEquals("local", identityConverter.convertToDatabaseColumn(IdentityProvider.LOCAL));
    }

    @Test
    void identityProvider_convertToDatabaseColumn_nullReturnsNull() {
        assertNull(identityConverter.convertToDatabaseColumn(null));
    }

    @Test
    void identityProvider_convertToEntityAttribute_returnsEnum() {
        assertEquals(IdentityProvider.GOOGLE, identityConverter.convertToEntityAttribute("google"));
        assertEquals(
                IdentityProvider.AZURE_AD, identityConverter.convertToEntityAttribute("azure_ad"));
    }

    @Test
    void identityProvider_convertToEntityAttribute_nullReturnsNull() {
        assertNull(identityConverter.convertToEntityAttribute(null));
    }

    // ── EmploymentStatusConverter ──────────────────────────────────────────────

    @Test
    void employmentStatus_convertToDatabaseColumn_returnsDbValue() {
        assertEquals(
                "active", employmentConverter.convertToDatabaseColumn(EmploymentStatus.ACTIVE));
        assertEquals(
                "on_leave", employmentConverter.convertToDatabaseColumn(EmploymentStatus.ON_LEAVE));
        assertEquals(
                "terminated",
                employmentConverter.convertToDatabaseColumn(EmploymentStatus.TERMINATED));
    }

    @Test
    void employmentStatus_convertToDatabaseColumn_nullReturnsNull() {
        assertNull(employmentConverter.convertToDatabaseColumn(null));
    }

    @Test
    void employmentStatus_convertToEntityAttribute_returnsEnum() {
        assertEquals(
                EmploymentStatus.ACTIVE, employmentConverter.convertToEntityAttribute("active"));
        assertEquals(
                EmploymentStatus.ON_LEAVE,
                employmentConverter.convertToEntityAttribute("on_leave"));
        assertEquals(
                EmploymentStatus.TERMINATED,
                employmentConverter.convertToEntityAttribute("terminated"));
    }

    @Test
    void employmentStatus_convertToEntityAttribute_nullReturnsNull() {
        assertNull(employmentConverter.convertToEntityAttribute(null));
    }

    // ── GoalReviewDecisionConverter ────────────────────────────────────────────

    @Test
    void goalReviewDecision_convertToDatabaseColumn_returnsDbValue() {
        assertEquals(
                "approved",
                goalReviewConverter.convertToDatabaseColumn(GoalReviewDecision.APPROVED));
        assertEquals(
                "revision_requested",
                goalReviewConverter.convertToDatabaseColumn(GoalReviewDecision.REVISION_REQUESTED));
        assertEquals(
                "cancelled",
                goalReviewConverter.convertToDatabaseColumn(GoalReviewDecision.CANCELLED));
    }

    @Test
    void goalReviewDecision_convertToDatabaseColumn_nullReturnsNull() {
        assertNull(goalReviewConverter.convertToDatabaseColumn(null));
    }

    @Test
    void goalReviewDecision_convertToEntityAttribute_returnsEnum() {
        assertEquals(
                GoalReviewDecision.APPROVED,
                goalReviewConverter.convertToEntityAttribute("approved"));
        assertEquals(
                GoalReviewDecision.REVISION_REQUESTED,
                goalReviewConverter.convertToEntityAttribute("revision_requested"));
    }

    @Test
    void goalReviewDecision_convertToEntityAttribute_nullReturnsNull() {
        assertNull(goalReviewConverter.convertToEntityAttribute(null));
    }
}
