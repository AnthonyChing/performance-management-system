package com.pms.entity.enums;

public enum AppealAssignee {
    SENIOR_MANAGER("senior_manager"),
    HR("hr");

    private final String dbValue;

    AppealAssignee(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static AppealAssignee fromDbValue(String dbValue) {
        for (AppealAssignee value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown AppealAssignee db value: " + dbValue);
    }
}
