package com.pms.entity.enums;

public enum GoalReviewDecision {
    APPROVED("approved"),
    REVISION_REQUESTED("revision_requested"),
    CANCELLED("cancelled");

    private final String dbValue;

    GoalReviewDecision(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static GoalReviewDecision fromDbValue(String dbValue) {
        for (GoalReviewDecision value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown GoalReviewDecision db value: " + dbValue);
    }
}
