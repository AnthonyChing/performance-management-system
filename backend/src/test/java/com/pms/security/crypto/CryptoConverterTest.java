package com.pms.security.crypto;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class CryptoConverterTest {

    private final CryptoConverter converter = new CryptoConverter();

    @BeforeAll
    static void setUpAll() {
        EncryptionUtil util = new EncryptionUtil();
        util.setSecretKeyString("my-super-secret-test-key-must-be-32-bytes");
    }

    @Test
    void convertToDatabaseColumn_withNull_returnsNull() {
        assertNull(converter.convertToDatabaseColumn(null));
    }

    @Test
    void convertToDatabaseColumn_withValue_returnsEncrypted() {
        String input = "test-data";
        String encrypted = converter.convertToDatabaseColumn(input);
        assertNotNull(encrypted);
        assertNotEquals(input, encrypted);

        // Decrypt to verify
        assertEquals(input, EncryptionUtil.decrypt(encrypted));
    }

    @Test
    void convertToEntityAttribute_withNull_returnsNull() {
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    void convertToEntityAttribute_withEncryptedValue_returnsDecrypted() {
        String input = "test-data";
        String encrypted = EncryptionUtil.encrypt(input);
        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(input, decrypted);
    }

    @Test
    void convertToEntityAttribute_withPlaintextFallback_returnsPlaintext() {
        String plaintext = "I am plain text";
        String result = converter.convertToEntityAttribute(plaintext);
        assertEquals(plaintext, result);
    }
}
