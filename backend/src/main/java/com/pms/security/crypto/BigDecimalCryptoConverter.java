package com.pms.security.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.math.BigDecimal;

@Converter
public class BigDecimalCryptoConverter implements AttributeConverter<BigDecimal, String> {

    @Override
    public String convertToDatabaseColumn(BigDecimal attribute) {
        if (attribute == null) {
            return null;
        }
        return EncryptionUtil.encrypt(attribute.toString());
    }

    @Override
    public BigDecimal convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        String decrypted = EncryptionUtil.decrypt(dbData);
        try {
            return new BigDecimal(decrypted);
        } catch (NumberFormatException e) {
            // Fallback for unencrypted legacy data that might fail to parse if somehow corrupted
            // But usually dbData IS the numeric string if it failed to decrypt
            return new BigDecimal(dbData);
        }
    }
}
