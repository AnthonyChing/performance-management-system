package com.pms.entity.enums;

public enum GoalType {
    INDIVIDUAL("individual"),
    TEAM("team");

    private final String dbValue;

    GoalType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static GoalType fromDbValue(String dbValue) {
        for (GoalType value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown GoalType db value: " + dbValue);
    }
}
