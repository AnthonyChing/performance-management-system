package com.pms.entity.enums;

public enum ReviewStatus {
    PENDING_SELF_EVAL("pending_self_eval"),
    SELF_EVAL_IN_PROGRESS("self_eval_in_progress"),
    PENDING_MANAGER_EVAL("pending_manager_eval"),
    MANAGER_EVAL_IN_PROGRESS("manager_eval_in_progress"),
    PENDING_HR_REVIEW("pending_hr_review"),
    COMPLETED("completed"),
    TERMINATED("terminated");

    private final String dbValue;

    ReviewStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static ReviewStatus fromDbValue(String dbValue) {
        for (ReviewStatus value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown ReviewStatus db value: " + dbValue);
    }
}
