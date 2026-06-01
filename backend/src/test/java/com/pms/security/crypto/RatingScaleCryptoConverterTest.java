package com.pms.security.crypto;

import static org.junit.jupiter.api.Assertions.*;

import com.pms.entity.enums.RatingScale;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class RatingScaleCryptoConverterTest {

    private final RatingScaleCryptoConverter converter = new RatingScaleCryptoConverter();

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
        RatingScale input = RatingScale.EXCEEDS_EXPECTATIONS;
        String encrypted = converter.convertToDatabaseColumn(input);
        assertNotNull(encrypted);
        assertNotEquals(input.getDbValue(), encrypted);

        assertEquals(input.getDbValue(), EncryptionUtil.decrypt(encrypted));
    }

    @Test
    void convertToEntityAttribute_withNull_returnsNull() {
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    void convertToEntityAttribute_withEncryptedValue_returnsDecryptedEnum() {
        RatingScale input = RatingScale.OUTSTANDING;
        String encrypted = EncryptionUtil.encrypt(input.getDbValue());
        RatingScale decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(input, decrypted);
    }

    @Test
    void convertToEntityAttribute_withPlaintextFallback_returnsParsedEnum() {
        String plaintext = "meets_expectations";
        RatingScale result = converter.convertToEntityAttribute(plaintext);
        assertEquals(RatingScale.MEETS_EXPECTATIONS, result);
    }

    @Test
    void convertToEntityAttribute_withInvalidValue_throwsException() {
        String invalid = "invalid_enum_value";
        assertThrows(
                IllegalArgumentException.class, () -> converter.convertToEntityAttribute(invalid));
    }
}
