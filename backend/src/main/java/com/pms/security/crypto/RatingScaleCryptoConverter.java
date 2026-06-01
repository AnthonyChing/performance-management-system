package com.pms.security.crypto;

import com.pms.entity.enums.RatingScale;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RatingScaleCryptoConverter implements AttributeConverter<RatingScale, String> {

    @Override
    public String convertToDatabaseColumn(RatingScale attribute) {
        if (attribute == null) {
            return null;
        }
        return EncryptionUtil.encrypt(attribute.getDbValue());
    }

    @Override
    public RatingScale convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        String decrypted = EncryptionUtil.decrypt(dbData);
        try {
            return RatingScale.fromDbValue(decrypted);
        } catch (IllegalArgumentException e) {
            // Fallback: the decrypted value might be invalid if it was some old legacy value,
            // but we must just throw if it's not a valid rating scale.
            // But wait, what if it's plaintext DB data that didn't need decryption?
            // fromDbValue handles parsing the plaintext correctly.
            return RatingScale.fromDbValue(dbData);
        }
    }
}
