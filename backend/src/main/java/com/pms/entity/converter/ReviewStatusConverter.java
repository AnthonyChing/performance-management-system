package com.pms.entity.converter;

import com.pms.entity.enums.ReviewStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ReviewStatusConverter implements AttributeConverter<ReviewStatus, String> {
    @Override
    public String convertToDatabaseColumn(ReviewStatus attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public ReviewStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ReviewStatus.fromDbValue(dbData);
    }
}
