import {
  listAppeals as apiListAppeals,
  getAppeal as apiGetAppeal,
  updateAppeal as apiUpdateAppeal,
} from '../../../api/manager';
import type { Appeal, ManagerApiOptions } from '../../../api/manager';
import type { AppealStatus } from './types';

/**
 * Fetch all appeals for a team, optionally filtered by status.
 */
export async function fetchAppeals(
  teamId: string,
  status?: AppealStatus,
  options?: ManagerApiOptions,
): Promise<Appeal[]> {
  const result = await apiListAppeals(teamId, status ? { status } : {}, options);
  return result.data;
}

/**
 * Fetch a single appeal's full detail (including responses).
 */
export async function fetchAppealDetail(
  teamId: string,
  appealId: string,
  options?: ManagerApiOptions,
): Promise<Appeal> {
  return apiGetAppeal(teamId, appealId, options);
}

/**
 * Submit a manager response to an appeal.
 */
export async function respondToAppeal(
  teamId: string,
  appealId: string,
  responseText: string,
  isFinal: boolean,
  outcome?: 'approved' | 'rejected',
  options?: ManagerApiOptions,
): Promise<Appeal> {
  return apiUpdateAppeal(
    teamId,
    appealId,
    { response_text: responseText, is_final: isFinal, ...(isFinal && outcome ? { outcome } : {}) },
    options,
  );
}
