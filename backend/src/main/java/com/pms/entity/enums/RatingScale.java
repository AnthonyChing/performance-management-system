package com.pms.entity.enums;

public enum RatingScale {
    OUTSTANDING("outstanding"),
    EXCEEDS_EXPECTATIONS("exceeds_expectations"),
    MEETS_EXPECTATIONS("meets_expectations"),
    NEEDS_IMPROVEMENT("needs_improvement"),
    UNACCEPTABLE("unacceptable");

    private final String dbValue;

    RatingScale(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static RatingScale fromDbValue(String dbValue) {
        for (RatingScale value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown RatingScale db value: " + dbValue);
    }
}
