import { useState, useCallback } from 'react';
import { ApiRequestError } from '../../api/manager';

export interface ApiErrorState {
  status: number;
  code: string;
  message: string;
  details: Array<{ field?: string; message: string }>;
}

/**
 * Lightweight hook to track API error state and expose it in a shape
 * compatible with `<ApiErrorBanner />`.
 *
 * Usage:
 * ```ts
 * const { error, setFromCatch, clear } = useApiError();
 *
 * try { await someApiCall(); } catch (e) { setFromCatch(e); }
 *
 * {error && <ApiErrorBanner {...error} />}
 * ```
 */
export function useApiError() {
  const [error, setError] = useState<ApiErrorState | null>(null);

  /**
   * Accept any caught value and convert it into the structured error state.
   * - `ApiRequestError` → uses its status, code, message, details
   * - plain `Error` → wraps as a generic 0-status error
   * - anything else → generic fallback
   */
  const setFromCatch = useCallback((caught: unknown) => {
    if (caught instanceof ApiRequestError) {
      setError({
        status: caught.status,
        code: caught.code,
        message: caught.message,
        details: caught.details,
      });
      return;
    }

    if (caught instanceof Error) {
      setError({
        status: 0,
        code: 'CLIENT_ERROR',
        message: caught.message,
        details: [],
      });
      return;
    }

    setError({
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: '發生非預期的錯誤，請稍後再試。',
      details: [],
    });
  }, []);

  const clear = useCallback(() => {
    setError(null);
  }, []);

  return { error, setFromCatch, clear } as const;
}
