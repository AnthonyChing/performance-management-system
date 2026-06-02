const ratingScaleLabels: Record<string, string> = {
  outstanding: '卓越',
  exceeds_expectations: '超出預期',
  meets_expectations: '符合預期',
  needs_improvement: '需改進',
  unacceptable: '不符合期待',
};

export function formatRatingScale(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return ratingScaleLabels[value] ?? value;
}

export function getRatingScaleClass(value: string | null | undefined) {
  if (!value) {
    return 'bg-slate-100 text-slate-600';
  }

  if (value === 'outstanding' || value === 'exceeds_expectations' || value.startsWith('A')) {
    return 'bg-green-100 text-green-700';
  }

  if (value === 'meets_expectations' || value.startsWith('B')) {
    return 'bg-indigo-100 text-indigo-700';
  }

  if (value === 'needs_improvement' || value.startsWith('C')) {
    return 'bg-orange-100 text-orange-700';
  }

  if (value === 'unacceptable') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-slate-100 text-slate-600';
}
