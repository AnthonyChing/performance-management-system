package com.pms.entity.converter;

import com.pms.entity.enums.CycleType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class CycleTypeConverter implements AttributeConverter<CycleType, String> {
    @Override
    public String convertToDatabaseColumn(CycleType attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public CycleType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : CycleType.fromDbValue(dbData);
    }
}
