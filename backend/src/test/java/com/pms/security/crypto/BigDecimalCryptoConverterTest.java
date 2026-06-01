package com.pms.security.crypto;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class BigDecimalCryptoConverterTest {

    private final BigDecimalCryptoConverter converter = new BigDecimalCryptoConverter();

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
    void convertToDatabaseColumn_withValue_returnsEncryptedString() {
        BigDecimal input = new BigDecimal("123.45");
        String encrypted = converter.convertToDatabaseColumn(input);
        assertNotNull(encrypted);
        assertNotEquals(input.toString(), encrypted);

        assertEquals(input.toString(), EncryptionUtil.decrypt(encrypted));
    }

    @Test
    void convertToEntityAttribute_withNull_returnsNull() {
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    void convertToEntityAttribute_withEncryptedValue_returnsDecryptedBigDecimal() {
        BigDecimal input = new BigDecimal("987.65");
        String encrypted = EncryptionUtil.encrypt(input.toString());
        BigDecimal decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(input, decrypted);
    }

    @Test
    void convertToEntityAttribute_withPlaintextFallback_returnsParsedBigDecimal() {
        String plaintext = "55.55";
        BigDecimal result = converter.convertToEntityAttribute(plaintext);
        assertEquals(new BigDecimal("55.55"), result);
    }

    @Test
    void convertToEntityAttribute_withInvalidNumber_throwsException() {
        String invalid = "not-a-number";
        assertThrows(
                NumberFormatException.class, () -> converter.convertToEntityAttribute(invalid));
    }
}
