package com.pms.entity.enums;

public enum TemplateStatus {
    DRAFT("draft"),
    PUBLISHED("published");

    private final String dbValue;

    TemplateStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static TemplateStatus fromDbValue(String v) {
        for (TemplateStatus s : values()) {
            if (s.dbValue.equals(v)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown TemplateStatus: " + v);
    }
}
