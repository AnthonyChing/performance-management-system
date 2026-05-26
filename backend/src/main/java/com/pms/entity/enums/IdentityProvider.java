package com.pms.entity.enums;

public enum IdentityProvider {
    GOOGLE("google"),
    AZURE_AD("azure_ad"),
    OKTA("okta"),
    LOCAL("local");

    private final String dbValue;

    IdentityProvider(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static IdentityProvider fromDbValue(String dbValue) {
        for (IdentityProvider value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown IdentityProvider db value: " + dbValue);
    }
}
