import type { EvaluationQuestion } from '../../api/manager';

export const DEFAULT_MANAGER_EVALUATION_QUESTIONS: EvaluationQuestion[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174090',
    question_text: '整體工作表現評分',
    question_type: 'rating',
    rating_scale_max: 5,
    is_required: true,
    sort_order: 1,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174091',
    question_text: '跨部門協作與溝通能力',
    question_type: 'rating',
    rating_scale_max: 5,
    is_required: true,
    sort_order: 2,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174092',
    question_text: '請描述該員工本期最具代表性的成果或貢獻',
    question_type: 'text',
    rating_scale_max: null,
    is_required: true,
    sort_order: 3,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174093',
    question_text: '是否具備下一階段承擔更高責任的潛力？',
    question_type: 'boolean',
    rating_scale_max: null,
    is_required: false,
    sort_order: 4,
  },
];

export function resolveEvaluationQuestions(
  apiQuestions: EvaluationQuestion[] | undefined,
  responseQuestionIds: string[] = [],
): EvaluationQuestion[] {
  if (apiQuestions && apiQuestions.length > 0) {
    return [...apiQuestions].sort((a, b) => a.sort_order - b.sort_order);
  }

  const catalogById = new Map(DEFAULT_MANAGER_EVALUATION_QUESTIONS.map((q) => [q.id, q]));
  const resolved = new Map<string, EvaluationQuestion>();

  for (const question of DEFAULT_MANAGER_EVALUATION_QUESTIONS) {
    resolved.set(question.id, question);
  }

  for (const questionId of responseQuestionIds) {
    if (!resolved.has(questionId)) {
      resolved.set(questionId, {
        id: questionId,
        question_text: `評核問題 (${questionId.slice(0, 8)}…)`,
        question_type: 'text',
        rating_scale_max: null,
        is_required: true,
        sort_order: resolved.size + 1,
      });
    } else if (catalogById.has(questionId)) {
      resolved.set(questionId, catalogById.get(questionId)!);
    }
  }

  return [...resolved.values()].sort((a, b) => a.sort_order - b.sort_order);
}
