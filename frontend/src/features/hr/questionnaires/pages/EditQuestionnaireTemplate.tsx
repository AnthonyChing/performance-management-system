import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, GripVertical, Edit2, Copy, Trash2, Calendar, Building2, X, Info } from 'lucide-react';

interface Question {
  id: number;
  content: string;
  type: string;
  scale?: string;
  limit?: string;
  options?: string;
  mandatory: boolean;
}

export default function QuestionnaireDetail() {
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      content: '您對目前的工作環境是否感到滿意？',
      type: 'Rating Scale',
      scale: '1 - 5',
      mandatory: true
    },
    {
      id: 2,
      content: '您認為主管提供的反饋對您的職業成長是否有幫助？',
      type: 'Rating Scale',
      scale: '1 - 5',
      mandatory: true
    },
    {
      id: 3,
      content: '請描述您在過去一季中遇到最大的工作挑戰。',
      type: 'Text',
      limit: '500 Max',
      mandatory: false
    },
    {
      id: 4,
      content: '您認為公司在跨部門協作方面做得如何？',
      type: 'Rating Scale',
      scale: '1 - 10',
      mandatory: true
    },
    {
      id: 5,
      content: '您最喜歡公司目前哪一項福利政策？',
      type: 'Multiple Choice',
      options: '6 Options',
      mandatory: true
    }
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">2024 年度模板</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              研發中心 / 產品設計部
            </span>
            <span className="flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              2024/10/01 截止
            </span>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingQuestion(null);
            setIsModalOpen(true);
          }}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增問題
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="divide-y divide-slate-200">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <button className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab">
                <GripVertical className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800 mb-2">{q.content}</h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-slate-500 mr-2 text-xs font-bold">題目類型</span>
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 text-xs font-medium">{q.type}</span>
                  </div>
                  {(q.scale || q.limit || q.options) && (
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2 text-xs font-bold">
                        {q.scale ? '評分範圍' : q.limit ? '限制字數' : '選項數量'}
                      </span>
                      <span className="text-slate-700 text-xs font-bold">{q.scale || q.limit || q.options}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-slate-500 mr-2 text-xs font-bold">是否為必填</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${q.mandatory ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                      {q.mandatory ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 sm:mt-0">
                <button 
                  onClick={() => {
                    setEditingQuestion(q);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-600">
            共計 <span className="font-bold text-slate-800">{questions.length}</span> 個問題
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded font-medium text-sm hover:bg-slate-50 transition-colors">
              預覽問卷
            </button>
            <button className="flex-1 sm:flex-none px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
              發布更新
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingQuestion ? '編輯問卷問題' : '建立問卷問題'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">問題題目 (QUESTION TITLE)</label>
                  <textarea 
                    rows={4}
                    className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm resize-none"
                    placeholder="請輸入績效考核問題描述..."
                    defaultValue={editingQuestion?.content || ''}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">問題類型 (QUESTION TYPE)</label>
                    <select 
                      className="w-full border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm appearance-none"
                      defaultValue={editingQuestion?.type === 'Text' ? 'Text (簡答題)' : editingQuestion?.type === 'Multiple Choice' ? 'Multiple Choice (單選題)' : 'Rating Scale (評分級距)'}
                    >
                      <option>Rating Scale (評分級距)</option>
                      <option>Text (簡答題)</option>
                      <option>Multiple Choice (單選題)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">評分級距 (RATING SCALE)</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
                      defaultValue={editingQuestion?.scale || '1-5'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">是否為必填 (IS MANDATORY)</label>
                  <div className="flex items-center gap-4">
                    <select 
                      className="w-48 border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm appearance-none"
                      defaultValue={editingQuestion?.mandatory !== false ? 'Yes (是)' : 'No (否)'}
                    >
                      <option>Yes (是)</option>
                      <option>No (否)</option>
                    </select>
                    <div className="flex items-center text-sm text-slate-500">
                      <Info className="w-4 h-4 mr-1.5" />
                      此設定會影響問卷的驗證規則
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  if (editingQuestion) {
                    setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...q, content: editingQuestion.content || '更新後的問題' } : q));
                  } else {
                    setQuestions([...questions, {
                      id: Date.now(),
                      content: '這是一題新增的問題',
                      type: 'Rating Scale',
                      scale: '1-5',
                      mandatory: true
                    }]);
                  }
                  setIsModalOpen(false);
                }}
                className="px-5 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm"
              >
                {editingQuestion ? '確定儲存' : '確定新增問題'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
