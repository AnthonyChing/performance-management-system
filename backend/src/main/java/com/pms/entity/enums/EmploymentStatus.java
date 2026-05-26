package com.pms.entity.enums;

public enum EmploymentStatus {
    ACTIVE("active"),
    ON_LEAVE("on_leave"),
    TERMINATED("terminated");

    private final String dbValue;

    EmploymentStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static EmploymentStatus fromDbValue(String dbValue) {
        for (EmploymentStatus value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown EmploymentStatus db value: " + dbValue);
    }
}
