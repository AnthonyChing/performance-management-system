import type { EvaluationQuestion } from '../../api/manager';
import type { QuestionnaireDraftResponse, QuestionnaireValidationIssue } from './types';

export function buildQuestionnaireDraftFromResponses(
  questions: EvaluationQuestion[],
  responses: Array<{
    question_id: string;
    rating_value?: number | null;
    text_value?: string | null;
    boolean_value?: boolean | null;
  }> = [],
): Record<string, QuestionnaireDraftResponse> {
  const byQuestionId = new Map(responses.map((response) => [response.question_id, response]));
  const draft: Record<string, QuestionnaireDraftResponse> = {};

  for (const question of questions) {
    const existing = byQuestionId.get(question.id);
    draft[question.id] = {
      question_id: question.id,
      rating_value: existing?.rating_value ?? undefined,
      text_value: existing?.text_value ?? undefined,
      boolean_value: existing?.boolean_value ?? undefined,
    };
  }

  return draft;
}

export function validateQuestionnaireResponses(
  questions: EvaluationQuestion[],
  draft: Record<string, QuestionnaireDraftResponse>,
): QuestionnaireValidationIssue[] {
  const issues: QuestionnaireValidationIssue[] = [];

  for (const question of questions) {
    const response = draft[question.id];
    if (!response) {
      if (question.is_required) {
        issues.push({ question_id: question.id, message: '此為必填問題。' });
      }
      continue;
    }

    if (question.question_type === 'rating') {
      const rating = response.rating_value;
      if (question.is_required && (rating === undefined || rating === null)) {
        issues.push({ question_id: question.id, message: '請選擇評分。' });
        continue;
      }
      if (
        rating !== undefined &&
        rating !== null &&
        question.rating_scale_max !== null &&
        (rating < 1 || rating > question.rating_scale_max)
      ) {
        issues.push({
          question_id: question.id,
          message: `評分需介於 1 至 ${question.rating_scale_max}。`,
        });
      }
    }

    if (question.question_type === 'text') {
      const text = response.text_value?.trim() ?? '';
      if (question.is_required && !text) {
        issues.push({ question_id: question.id, message: '請填寫文字回覆。' });
      }
    }

    if (question.question_type === 'boolean') {
      if (question.is_required && response.boolean_value === undefined) {
        issues.push({ question_id: question.id, message: '請選擇是或否。' });
      }
    }
  }

  return issues;
}

export function toQuestionnairePayload(
  draft: Record<string, QuestionnaireDraftResponse>,
): QuestionnaireDraftResponse[] {
  return Object.values(draft).map((response) => ({
    question_id: response.question_id,
    ...(response.rating_value !== undefined ? { rating_value: response.rating_value } : {}),
    ...(response.text_value !== undefined && response.text_value !== ''
      ? { text_value: response.text_value }
      : {}),
    ...(response.boolean_value !== undefined ? { boolean_value: response.boolean_value } : {}),
  }));
}
