package com.pms.security.crypto;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class EncryptionUtilTest {

    private static EncryptionUtil encryptionUtil;

    @BeforeAll
    static void setUp() {
        encryptionUtil = new EncryptionUtil();
        encryptionUtil.setSecretKeyString("my-super-secret-test-key-must-be-32-bytes");
    }

    @Test
    void testEncryptDecryptString() {
        String originalText = "Hello, Manager! This is a sensitive comment.";
        String encrypted = EncryptionUtil.encrypt(originalText);

        assertNotNull(encrypted);
        assertNotEquals(originalText, encrypted);
        assertTrue(encrypted.length() > originalText.length());

        String decrypted = EncryptionUtil.decrypt(encrypted);
        assertEquals(originalText, decrypted);
    }

    @Test
    void testEncryptDecryptSameTextYieldsDifferentCiphertexts() {
        // Because AES-GCM uses a random IV, same plaintext should produce different ciphertexts
        String originalText = "TopSecret123";
        String encrypted1 = EncryptionUtil.encrypt(originalText);
        String encrypted2 = EncryptionUtil.encrypt(originalText);

        assertNotEquals(encrypted1, encrypted2);

        assertEquals(originalText, EncryptionUtil.decrypt(encrypted1));
        assertEquals(originalText, EncryptionUtil.decrypt(encrypted2));
    }

    @Test
    void testDecryptUnencryptedData() {
        // This simulates backward compatibility when DB has plain text
        String plainTextInDb = "I am not encrypted";
        String decrypted = EncryptionUtil.decrypt(plainTextInDb);

        // Should fall back to returning original text if it's not base64 or valid GCM payload
        assertEquals(plainTextInDb, decrypted);
    }

    @Test
    void testCryptoConverter() {
        CryptoConverter converter = new CryptoConverter();
        String raw = "John Doe";
        String dbData = converter.convertToDatabaseColumn(raw);
        assertNotEquals(raw, dbData);
        assertEquals(raw, converter.convertToEntityAttribute(dbData));
    }

    @Test
    void testBigDecimalCryptoConverter() {
        BigDecimalCryptoConverter converter = new BigDecimalCryptoConverter();
        BigDecimal rawScore = new BigDecimal("4.50");
        String dbData = converter.convertToDatabaseColumn(rawScore);
        assertNotEquals("4.50", dbData);
        assertEquals(rawScore, converter.convertToEntityAttribute(dbData));
    }

    @Test
    void testEncryptNull_returnsNull() {
        assertNull(EncryptionUtil.encrypt(null));
    }

    @Test
    void testDecryptNullOrEmpty_returnsOriginal() {
        assertNull(EncryptionUtil.decrypt(null));
        assertEquals("", EncryptionUtil.decrypt(""));
        assertEquals("   ", EncryptionUtil.decrypt("   "));
    }

    @Test
    void testFallbackSecretKeyIfTooShort() {
        EncryptionUtil util = new EncryptionUtil();
        util.setSecretKeyString("short");
        String encrypted = EncryptionUtil.encrypt("test-data");
        assertEquals("test-data", EncryptionUtil.decrypt(encrypted));
        util.setSecretKeyString("my-super-secret-test-key-must-be-32-bytes");
    }

    @Test
    void testDecryptWithInvalidBase64ButValidFallback_returnsOriginal() {
        String plaintext = "This is valid plaintext but invalid base64!";
        assertEquals(plaintext, EncryptionUtil.decrypt(plaintext));
    }
}
