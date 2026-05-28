package com.pms.entity.enums;

public enum EvaluationTemplateStatus {
    PUBLISHED("published"),
    ARCHIVED("archived");

    private final String dbValue;

    EvaluationTemplateStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static EvaluationTemplateStatus fromDbValue(String v) {
        for (EvaluationTemplateStatus s : values()) if (s.dbValue.equals(v)) return s;
        throw new IllegalArgumentException("Unknown EvaluationTemplateStatus: " + v);
    }
}
