import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Building2 } from 'lucide-react';

interface Question {
  id: number;
  content: string;
  type: string;
  scale?: string;
  limit?: string;
  options?: string;
  mandatory: boolean;
}

export default function ViewQuestionnaireTemplate() {
  const { id } = useParams();
  const [questions] = useState<Question[]>([
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
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            這是一份用於評估員工對工作環境、主管反饋及整體滿意度的標準問卷模板，旨在收集建設性的內部反饋。
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              研發中心 / 產品設計部
            </span>
          </div>
        </div>
        <Link 
          to={`/hr/questionnaires/${id || 1}/edit`}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm"
        >
          編輯
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="divide-y divide-slate-200">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
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
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-600">
            共計 <span className="font-bold text-slate-800">{questions.length}</span> 個問題
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
              預覽問卷
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
