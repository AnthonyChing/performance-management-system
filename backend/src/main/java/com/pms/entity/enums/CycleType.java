package com.pms.entity.enums;

public enum CycleType {
    ANNUAL("annual"),
    QUARTERLY("quarterly"),
    PROBATION("probation");

    private final String dbValue;

    CycleType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static CycleType fromDbValue(String dbValue) {
        for (CycleType value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown CycleType db value: " + dbValue);
    }
}
