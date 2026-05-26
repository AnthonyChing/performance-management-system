package com.pms.entity.converter;

import com.pms.entity.enums.CycleStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class CycleStatusConverter implements AttributeConverter<CycleStatus, String> {
    @Override
    public String convertToDatabaseColumn(CycleStatus attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public CycleStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : CycleStatus.fromDbValue(dbData);
    }
}
