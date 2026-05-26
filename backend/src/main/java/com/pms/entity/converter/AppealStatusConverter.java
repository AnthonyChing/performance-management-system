package com.pms.entity.converter;

import com.pms.entity.enums.AppealStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AppealStatusConverter implements AttributeConverter<AppealStatus, String> {
    @Override
    public String convertToDatabaseColumn(AppealStatus attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public AppealStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : AppealStatus.fromDbValue(dbData);
    }
}
