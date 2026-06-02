import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KpiScoringForm from '../src/features/manager/evaluations/components/KpiScoringForm';
import KpiCriterionCard from '../src/features/manager/kpis/components/KpiCriterionCard';
import type { SubordinateKpi } from '../src/api/manager';
import type { KpiCriterion } from '../src/features/manager/kpis/api';

const subordinateKpi: SubordinateKpi = {
  id: 'kpi-1',
  cycle_id: 'cycle-1',
  created_by: 'manager-1',
  kpi_type: 'individual',
  title: '核心產品開發進度',
  description: '完成核心模組',
  unit: 'module',
  target_operator: 'gte',
  target_value: 4,
  target_unit: 'module',
  target_display_text: null,
  assignment: {
    weight: 40,
    target_value: 4,
    current_value: 5,
    last_updated_at: null,
  },
  published_at: null,
};

const kpiCriterion: KpiCriterion = {
  id: 'kpi-1',
  cycleId: 'cycle-1',
  createdBy: 'manager-1',
  kpiType: 'individual',
  title: '核心產品開發進度',
  description: '完成核心模組',
  unit: 'module',
  targetOperator: 'gte',
  targetValue: 4,
  targetUnit: 'module',
  targetDisplayText: null,
  weight: 40,
  assignmentTargetValue: 4,
  currentValue: 5,
  publishedAt: null,
};

describe('manager KPI current value UI', () => {
  it('edits current_value in the team evaluation KPI form', () => {
    const onKpiChange = vi.fn();

    render(
      <KpiScoringForm
        kpis={[subordinateKpi]}
        kpiDrafts={[{ kpi_id: 'kpi-1', current_value: 5, manager_feedback: '' }]}
        finalRating=""
        managerComment=""
        disabled={false}
        onKpiChange={onKpiChange}
        onFinalRatingChange={vi.fn()}
        onManagerCommentChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onSubmitFinal={vi.fn()}
        isSaving={false}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '6' } });

    expect(onKpiChange).toHaveBeenCalledWith('kpi-1', { current_value: 6 });
    expect(screen.queryByText('主管評分 (0-100)')).not.toBeInTheDocument();
  });

  it('does not render the current value update action in KPI criteria cards', () => {
    render(
      <KpiCriterionCard
        kpi={kpiCriterion}
        employeeName="陳大文"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByText('目前數值').length).toBeGreaterThan(0);
    expect(screen.queryByText('設定數值')).not.toBeInTheDocument();
  });
});
