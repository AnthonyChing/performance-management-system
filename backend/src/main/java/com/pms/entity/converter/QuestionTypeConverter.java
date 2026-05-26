package com.pms.entity.converter;

import com.pms.entity.enums.QuestionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class QuestionTypeConverter implements AttributeConverter<QuestionType, String> {
    @Override
    public String convertToDatabaseColumn(QuestionType a) {
        return a == null ? null : a.getDbValue();
    }

    @Override
    public QuestionType convertToEntityAttribute(String d) {
        return d == null ? null : QuestionType.fromDbValue(d);
    }
}
