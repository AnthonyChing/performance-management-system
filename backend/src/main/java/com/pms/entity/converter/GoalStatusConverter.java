package com.pms.entity.converter;

import com.pms.entity.enums.GoalStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class GoalStatusConverter implements AttributeConverter<GoalStatus, String> {
    @Override
    public String convertToDatabaseColumn(GoalStatus attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public GoalStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : GoalStatus.fromDbValue(dbData);
    }
}
