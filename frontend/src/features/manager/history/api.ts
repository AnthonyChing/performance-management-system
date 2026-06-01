import { listMySubordinates, listEvaluations, RatingScale } from '../../../api/manager';
import type { HistoricalRecord } from './types';

export { listMySubordinates, listEvaluations };

function mapRatingToGradeAndScore(rating: RatingScale | null): { grade: string; score: number } {
  switch (rating) {
    case 'outstanding':
      return { grade: 'A', score: 95 };
    case 'exceeds_expectations':
      return { grade: 'A-', score: 88 };
    case 'meets_expectations':
      return { grade: 'B+', score: 78 };
    case 'needs_improvement':
      return { grade: 'B', score: 60 };
    case 'unacceptable':
      return { grade: 'C', score: 40 };
    default:
      return { grade: 'B-', score: 70 };
  }
}

export async function loadHistoryDataAsync(): Promise<{
  records: HistoricalRecord[];
  teams: Array<{ id: string; name: string }>;
}> {
  try {
    const subsRes = await listMySubordinates();
    const subordinates = subsRes.data;

    // Fetch evaluations for all subordinates in parallel
    const evalPromises = subordinates.map(async (sub) => {
      try {
        const evalRes = await listEvaluations(sub.id);
        return { sub, evaluations: evalRes.data };
      } catch (err) {
        console.error(`Failed to load evaluations for subordinate ${sub.id}`, err);
        return { sub, evaluations: [] };
      }
    });

    const results = await Promise.all(evalPromises);
    const records: HistoricalRecord[] = [];

    // Extract unique departments for teams filter
    const teamMap = new Map<string, string>();

    for (const { sub, evaluations } of results) {
      const dept = sub.department || 'General';
      teamMap.set(dept, dept);

      // Filter reviews that are completed
      const completedEvals = evaluations.filter(e => e.status === 'completed');

      for (const ev of completedEvals) {
        const { grade, score: defaultScore } = mapRatingToGradeAndScore(ev.final_rating);

        // Compute overall score out of 100
        let finalScore = defaultScore;
        if (ev.kpi_score !== null && ev.kpi_score !== undefined && ev.kpi_score > 0) {
          if (ev.review_score !== null && ev.review_score !== undefined && ev.review_score > 0) {
            finalScore = Math.round((ev.kpi_score + ev.review_score) / 2);
          } else {
            finalScore = Math.round(ev.kpi_score);
          }
        } else if (ev.review_score !== null && ev.review_score !== undefined && ev.review_score > 0) {
          finalScore = Math.round(ev.review_score);
        }

        // Extract up to 2 high-scoring KPI feedback or fallbacks
        const highlightKpis: string[] = [];
        if (ev.kpi_evaluations && ev.kpi_evaluations.length > 0) {
          const feedbackItems = ev.kpi_evaluations
            .filter(k => k.manager_feedback && k.manager_feedback.trim())
            .map(k => k.manager_feedback!.trim());
          highlightKpis.push(...feedbackItems.slice(0, 2));
        }

        if (highlightKpis.length === 0) {
          highlightKpis.push(
            '達成本期主要工作目標與職能指標',
            '展現優良的團隊協作與專業交付品質'
          );
        }

        records.push({
          id: ev.id,
          period: ev.cycle_name || '未命名考核週期',
          memberName: sub.name,
          role: sub.job_title || '員工',
          score: finalScore,
          overallGrade: grade,
          highlightKpis,
          comments: ev.manager_comment || '無主管綜合評語',
          teamId: dept
        });
      }
    }

    const teams = Array.from(teamMap.keys()).map(id => ({
      id,
      name: id === 'General' ? '一般部門' : id
    }));

    return { records, teams };
  } catch (error) {
    console.error('Failed to load history data', error);
    return { records: [], teams: [] };
  }
}
