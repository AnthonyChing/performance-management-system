package com.pms.entity.converter;

import com.pms.entity.enums.EvaluationTemplateStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EvaluationTemplateStatusConverter
        implements AttributeConverter<EvaluationTemplateStatus, String> {

    @Override
    public String convertToDatabaseColumn(EvaluationTemplateStatus a) {
        return a == null ? null : a.getDbValue();
    }

    @Override
    public EvaluationTemplateStatus convertToEntityAttribute(String d) {
        return d == null ? null : EvaluationTemplateStatus.fromDbValue(d);
    }
}
