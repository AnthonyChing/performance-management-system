package com.pms.entity.converter;

import com.pms.entity.enums.GoalType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class GoalTypeConverter implements AttributeConverter<GoalType, String> {
    @Override
    public String convertToDatabaseColumn(GoalType attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public GoalType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : GoalType.fromDbValue(dbData);
    }
}
