package com.pms.entity.converter;

import com.pms.entity.enums.AppealAssignee;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AppealAssigneeConverter implements AttributeConverter<AppealAssignee, String> {
    @Override
    public String convertToDatabaseColumn(AppealAssignee attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public AppealAssignee convertToEntityAttribute(String dbData) {
        return dbData == null ? null : AppealAssignee.fromDbValue(dbData);
    }
}
