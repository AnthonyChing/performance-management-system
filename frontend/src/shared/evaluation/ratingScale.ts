import type { RatingScale } from '../../api/manager';

export const RATING_SCALE_OPTIONS: Array<{ value: RatingScale; label: string }> = [
  { value: 'outstanding', label: '傑出 (Outstanding)' },
  { value: 'exceeds_expectations', label: '超出預期 (Exceeds)' },
  { value: 'meets_expectations', label: '符合預期 (Meets)' },
  { value: 'needs_improvement', label: '待改善 (Needs Improvement)' },
  { value: 'unacceptable', label: '不符合 (Unacceptable)' },
];

export function getRatingScaleLabel(value: RatingScale | null | undefined): string {
  if (!value) return '—';
  return RATING_SCALE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
