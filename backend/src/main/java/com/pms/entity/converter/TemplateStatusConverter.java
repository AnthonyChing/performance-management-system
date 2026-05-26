package com.pms.entity.converter;

import com.pms.entity.enums.TemplateStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TemplateStatusConverter implements AttributeConverter<TemplateStatus, String> {
    @Override public String convertToDatabaseColumn(TemplateStatus a) { return a == null ? null : a.getDbValue(); }
    @Override public TemplateStatus convertToEntityAttribute(String d) { return d == null ? null : TemplateStatus.fromDbValue(d); }
}
