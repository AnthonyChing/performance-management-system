package com.pms.entity.enums;

public enum AppealStatus {
    SUBMITTED("submitted"),
    UNDER_REVIEW("under_review"),
    NEED_MORE_INFO("need_more_info"),
    APPROVED("approved"),
    REJECTED("rejected"),
    CANCELLED("cancelled");

    private final String dbValue;

    AppealStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static AppealStatus fromDbValue(String dbValue) {
        for (AppealStatus value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown AppealStatus db value: " + dbValue);
    }
}
