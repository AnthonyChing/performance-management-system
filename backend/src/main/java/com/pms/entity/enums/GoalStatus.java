package com.pms.entity.enums;

public enum GoalStatus {
    PENDING_REVIEW("pending_review"),
    IN_PROGRESS("in_progress"),
    REVISION_REQUESTED("revision_requested"),
    COMPLETED("completed"),
    CANCELLED("cancelled");

    private final String dbValue;

    GoalStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static GoalStatus fromDbValue(String dbValue) {
        for (GoalStatus value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown GoalStatus db value: " + dbValue);
    }
}
