package com.pms.entity.converter;

import com.pms.entity.enums.EmploymentStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EmploymentStatusConverter implements AttributeConverter<EmploymentStatus, String> {
    @Override
    public String convertToDatabaseColumn(EmploymentStatus attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public EmploymentStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : EmploymentStatus.fromDbValue(dbData);
    }
}
