import { describe, expect, it } from 'vitest';
import {
  getQuestionnaire,
  listEvaluations,
  type Fetcher,
} from '../src/api/manager';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

describe('manager api', () => {
  it('accepts questionnaire payloads with omitted nullable fields', async () => {
    const fetcher: Fetcher = async () =>
      jsonResponse({
        review_id: 'review-1',
        questions: [
          {
            question_id: 'question-1',
            question_text: '請描述主要貢獻',
            question_type: 'text',
            is_required: true,
            sort_order: 1,
          },
        ],
        responses: [
          {
            id: 'response-1',
            question_id: 'question-1',
            respondent_type: 'manager',
            text_value: '持續交付穩定成果',
            responded_at: '2026-06-01T15:30:00+08:00',
          },
        ],
        updated_at: '2026-06-01T15:30:00+08:00',
      });

    const questionnaire = await getQuestionnaire('employee-1', 'review-1', { fetcher });

    expect(questionnaire.questions[0]).toEqual({
      id: 'question-1',
      question_text: '請描述主要貢獻',
      question_type: 'text',
      rating_scale_max: null,
      is_required: true,
      sort_order: 1,
    });
    expect(questionnaire.responses[0].rating_value).toBeUndefined();
    expect(questionnaire.responses[0].boolean_value).toBeUndefined();
  });

  it('accepts evaluation history payloads with omitted nullable fields', async () => {
    const fetcher: Fetcher = async () =>
      jsonResponse({
        data: [
          {
            id: 'review-1',
            cycle_id: 'cycle-1',
            employee_id: 'employee-1',
            manager_id: 'manager-1',
            status: 'manager_eval_in_progress',
            responses: [
              {
                id: 'response-1',
                question_id: 'question-1',
                respondent_type: 'manager',
                responded_at: '2026-06-01T15:30:00+08:00',
              },
            ],
            kpi_evaluations: [
              {
                kpi_id: 'kpi-1',
              },
            ],
          },
        ],
      });

    const result = await listEvaluations('employee-1', {}, { fetcher });

    expect(result.data[0].final_rating).toBeUndefined();
    expect(result.data[0].responses?.[0].rating_value).toBeUndefined();
    expect(result.data[0].kpi_evaluations?.[0].manager_score).toBeUndefined();
  });
});
