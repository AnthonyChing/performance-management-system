package com.pms.entity.converter;

import com.pms.entity.enums.RatingScale;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RatingScaleConverter implements AttributeConverter<RatingScale, String> {
    @Override
    public String convertToDatabaseColumn(RatingScale attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public RatingScale convertToEntityAttribute(String dbData) {
        return dbData == null ? null : RatingScale.fromDbValue(dbData);
    }
}
