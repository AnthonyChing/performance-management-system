import {
  listMySubordinates,
  listKpis,
  createKpi,
  updateKpi,
  deleteKpi,
} from '../../../api/manager';
import type { SubordinateKpi } from '../../../api/manager';
import { getCurrentPerformanceCycle } from '../../../api/employee';

export interface Subordinate {
  id: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
}

export interface KpiCriterion {
  id: string;
  cycleId: string;
  createdBy: string;
  kpiType: 'individual' | 'team';
  title: string;
  description: string | null;
  unit: string | null;
  targetOperator: string | null;
  targetValue: number | null;
  targetUnit: string | null;
  targetDisplayText: string | null;
  weight: number;
  assignmentTargetValue: number;
  currentValue: number | null;
  publishedAt: string | null;
}

function mapKpi(kpi: SubordinateKpi): KpiCriterion {
  return {
    id: kpi.id,
    cycleId: kpi.cycle_id,
    createdBy: kpi.created_by,
    kpiType: kpi.kpi_type,
    title: kpi.title,
    description: kpi.description,
    unit: kpi.unit,
    targetOperator: kpi.target_operator ?? null,
    targetValue: kpi.target_value ?? null,
    targetUnit: kpi.target_unit ?? null,
    targetDisplayText: kpi.target_display_text ?? null,
    weight: kpi.assignment?.weight ?? 0,
    assignmentTargetValue: kpi.assignment?.target_value ?? 0,
    currentValue: kpi.assignment?.current_value ?? null,
    publishedAt: kpi.published_at,
  };
}

export async function loadSubordinates(): Promise<Subordinate[]> {
  try {
    const res = await listMySubordinates();
    return res.data.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      department: s.department,
      jobTitle: s.job_title,
    }));
  } catch {
    console.error('Failed to load subordinates');
    return [];
  }
}

export async function loadKpisForEmployee(userId: string): Promise<KpiCriterion[]> {
  try {
    // Use the current active cycle so we never load KPIs from locked old cycles
    let cycleId: string | undefined;
    try {
      const { cycle } = await getCurrentPerformanceCycle();
      cycleId = cycle.cycle_id;
    } catch {
      // No active cycle or network error; fall through to unfiltered load
    }

    const res = await listKpis(userId, cycleId ? { cycle_id: cycleId } : {});
    const kpis = res.data.map(mapKpi);

    // Fallback: no active cycle found, keep only the most recent cycle's KPIs
    if (!cycleId && kpis.length > 0) {
      const latestCycleId = kpis[0].cycleId;
      return kpis.filter((k) => k.cycleId === latestCycleId);
    }

    return kpis;
  } catch {
    console.error('Failed to load KPIs for', userId);
    return [];
  }
}

export async function createKpiCriterion(
  userId: string,
  data: {
    title: string;
    description?: string;
    kpi_type: 'individual' | 'team';
    unit?: string;
    weight: number;
    target_value: number;
    target_operator?: string;
    target_unit?: string;
    target_display_text?: string;
  }
): Promise<KpiCriterion | null> {
  try {
    const res = await createKpi(userId, data);
    if (res.data.length > 0) {
      return mapKpi(res.data[0]);
    }
    return null;
  } catch (err) {
    console.error('Failed to create KPI', err);
    return null;
  }
}

export async function updateKpiCriterion(
  userId: string,
  kpiId: string,
  data: {
    title?: string;
    description?: string;
    unit?: string;
    kpi_type?: 'individual' | 'team';
    weight?: number;
    target_value?: number;
    current_value?: number;
    target_operator?: string;
    target_unit?: string;
    target_display_text?: string;
  }
): Promise<KpiCriterion | null> {
  try {
    const res = await updateKpi(userId, kpiId, data);
    return mapKpi(res);
  } catch (err) {
    console.error('Failed to update KPI', err);
    return null;
  }
}

export async function deleteKpiCriterion(
  userId: string,
  kpiId: string
): Promise<boolean> {
  try {
    await deleteKpi(userId, kpiId);
    return true;
  } catch (err) {
    console.error('Failed to delete KPI', err);
    return false;
  }
}
