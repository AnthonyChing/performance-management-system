package com.pms.entity.enums;

public enum QuestionType {
    RATING("rating"),
    TEXT("text"),
    BOOLEAN("boolean");

    private final String dbValue;

    QuestionType(String dbValue) { this.dbValue = dbValue; }

    public String getDbValue() { return dbValue; }

    public static QuestionType fromDbValue(String v) {
        for (QuestionType t : values()) if (t.dbValue.equals(v)) return t;
        throw new IllegalArgumentException("Unknown QuestionType: " + v);
    }
}
