package com.pms.entity.enums;

public enum CycleStatus {
    NOT_STARTED("not_started"),
    IN_PROGRESS("in_progress"),
    LOCKED("locked"),
    RESULTS_PUBLISHED("results_published"),
    COMPLETED("completed"),
    CLOSED("closed");

    private final String dbValue;

    CycleStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static CycleStatus fromDbValue(String dbValue) {
        for (CycleStatus value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown CycleStatus db value: " + dbValue);
    }
}
