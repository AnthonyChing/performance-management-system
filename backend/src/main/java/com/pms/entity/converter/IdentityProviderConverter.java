package com.pms.entity.converter;

import com.pms.entity.enums.IdentityProvider;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class IdentityProviderConverter implements AttributeConverter<IdentityProvider, String> {
    @Override
    public String convertToDatabaseColumn(IdentityProvider attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public IdentityProvider convertToEntityAttribute(String dbData) {
        return dbData == null ? null : IdentityProvider.fromDbValue(dbData);
    }
}
