package com.pms.entity.converter;

import com.pms.entity.enums.GoalReviewDecision;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class GoalReviewDecisionConverter implements AttributeConverter<GoalReviewDecision, String> {
    @Override
    public String convertToDatabaseColumn(GoalReviewDecision attr) {
        return attr == null ? null : attr.getDbValue();
    }

    @Override
    public GoalReviewDecision convertToEntityAttribute(String dbData) {
        return dbData == null ? null : GoalReviewDecision.fromDbValue(dbData);
    }
}
