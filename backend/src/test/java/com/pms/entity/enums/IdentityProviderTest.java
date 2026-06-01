package com.pms.entity.enums;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class IdentityProviderTest {

    @Test
    void fromDbValue_knownValues_returnsEnum() {
        assertEquals(IdentityProvider.GOOGLE, IdentityProvider.fromDbValue("google"));
        assertEquals(IdentityProvider.AZURE_AD, IdentityProvider.fromDbValue("azure_ad"));
        assertEquals(IdentityProvider.OKTA, IdentityProvider.fromDbValue("okta"));
        assertEquals(IdentityProvider.LOCAL, IdentityProvider.fromDbValue("local"));
    }

    @Test
    void fromDbValue_unknownValue_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> IdentityProvider.fromDbValue("unknown"));
    }

    @Test
    void getDbValue_returnsCorrectString() {
        assertEquals("google", IdentityProvider.GOOGLE.getDbValue());
        assertEquals("azure_ad", IdentityProvider.AZURE_AD.getDbValue());
        assertEquals("okta", IdentityProvider.OKTA.getDbValue());
        assertEquals("local", IdentityProvider.LOCAL.getDbValue());
    }
}
