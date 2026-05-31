import React from 'react';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { TYPE_OPTIONS } from './QuestionModal';

export interface ListItemQuestion {
  id?: string;
  localId?: number;
  question_text: string;
  question_type: string;
  rating_scale_max?: number | null;
  is_required: boolean;
}

interface QuestionListProps {
  questions: ListItemQuestion[];
  onDragStart: (idx: number) => void;
  onDrop: (idx: number) => void;
  onEdit?: (q: ListItemQuestion) => void;
  onDelete?: (q: ListItemQuestion) => void;
}

export default function QuestionList({
  questions,
  onDragStart,
  onDrop,
  onEdit,
  onDelete,
}: QuestionListProps) {
  return (
    <div className="divide-y divide-slate-200">
      {questions.map((q, idx) => (
        <div
          key={q.id || q.localId}
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(idx)}
          className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing"
        >
          <button className="mt-1 text-slate-400 hover:text-slate-600">
            <GripVertical className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0 mt-0.5">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-800 mb-2">{q.question_text}</h3>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-slate-500 mr-2 text-xs font-bold">題目類型</span>
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 text-xs font-medium">
                  {TYPE_OPTIONS.find((o) => o.value === q.question_type)?.label ?? q.question_type}
                </span>
              </div>
              {q.rating_scale_max != null && (
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2 text-xs font-bold">評分範圍</span>
                  <span className="text-slate-700 text-xs font-bold">1 – {q.rating_scale_max}</span>
                </div>
              )}
              <div className="flex items-center">
                <span className="text-slate-500 mr-2 text-xs font-bold">是否為必填</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${q.is_required ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                  {q.is_required ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {onEdit && (
              <button
                onClick={() => onEdit(q)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="編輯問題"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(q)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="刪除問題"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
