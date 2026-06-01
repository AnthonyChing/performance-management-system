import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, Loader2, X } from 'lucide-react';
import {
  createEvaluationTemplate,
  listAssessmentTemplates,
  listEmployeeGroups,
  listPerformanceCycles,
  type AssessmentTemplateListItem,
  type EmployeeGroup,
  type PerformanceCycle,
} from '../api';
import { ApiRequestError } from '../../../../api/hr';

interface SelectedAssessmentTemplate {
  assessmentTemplateId: string;
  weightPercent: number;
}

const steps = [
  { title: '基本資料' },
  { title: '指派問卷' },
  { title: '確認發布' },
];

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return '尚未登入或 token 失效。';
    }
    if (error.status === 403) {
      return '目前帳號沒有 HR 權限。';
    }
    return error.message;
  }

  return fallback;
}

function findAssessmentTemplateName(
  templates: AssessmentTemplateListItem[],
  assessmentTemplateId: string,
) {
  return templates.find((template) => template.id === assessmentTemplateId)?.name ?? assessmentTemplateId;
}

export default function CreateTemplate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [employeeGroups, setEmployeeGroups] = useState<EmployeeGroup[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplateListItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [employeeGroupId, setEmployeeGroupId] = useState('');
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<SelectedAssessmentTemplate[]>([]);

  const totalWeight = useMemo(
    () => selectedTemplates.reduce((sum, template) => sum + template.weightPercent, 0),
    [selectedTemplates],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadOptions() {
      setIsLoadingOptions(true);
      setLoadError(null);

      try {
        const [cycleResponse, groupResponse, assessmentResponse] = await Promise.all([
          listPerformanceCycles({ status: 'not_started' }, { signal: controller.signal }),
          listEmployeeGroups({ signal: controller.signal }),
          listAssessmentTemplates({ status: 'published' }, { signal: controller.signal }),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setCycles(cycleResponse.data);
        setEmployeeGroups(groupResponse.data);
        setAssessmentTemplates(assessmentResponse.data);
        setCycleId((current) => current || cycleResponse.data[0]?.id || '');
        setEmployeeGroupId((current) => current || groupResponse.data[0]?.group_id || '');
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(getApiErrorMessage(error, '無法載入建立考核模板所需資料。'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => controller.abort();
  }, []);

  function updateSelectedTemplate(assessmentTemplateId: string, checked: boolean) {
    setSelectedTemplates((current) => {
      if (checked) {
        if (current.some((template) => template.assessmentTemplateId === assessmentTemplateId)) {
          return current;
        }

        return [...current, { assessmentTemplateId, weightPercent: 0 }];
      }

      return current.filter((template) => template.assessmentTemplateId !== assessmentTemplateId);
    });
  }

  function updateWeight(assessmentTemplateId: string, weightPercent: number) {
    setSelectedTemplates((current) =>
      current.map((template) =>
        template.assessmentTemplateId === assessmentTemplateId
          ? { ...template, weightPercent }
          : template,
      ),
    );
  }

  function removeSelectedTemplate(assessmentTemplateId: string) {
    updateSelectedTemplate(assessmentTemplateId, false);
  }

  function validateBasicStep() {
    if (!name.trim()) {
      setSubmitError('請輸入考核名稱。');
      return false;
    }

    if (!cycleId) {
      setSubmitError('請選擇考核週期。');
      return false;
    }

    if (!employeeGroupId) {
      setSubmitError('請選擇員工群組。');
      return false;
    }

    setSubmitError(null);
    return true;
  }

  function validateQuestionnaireStep() {
    if (selectedTemplates.length === 0) {
      setSubmitError('請至少選擇一份已發布問卷模板。');
      return false;
    }

    if (totalWeight !== 100) {
      setSubmitError('請確保總配分比例等於 100%。');
      return false;
    }

    setSubmitError(null);
    return true;
  }

  async function handleSubmit() {
    if (!validateBasicStep() || !validateQuestionnaireStep()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createEvaluationTemplate({
        cycle_id: cycleId,
        name: name.trim(),
        description: description.trim() || undefined,
        employee_group_id: employeeGroupId,
        assessment_templates: selectedTemplates.map((template) => ({
          assessment_template_id: template.assessmentTemplateId,
          weight_percent: template.weightPercent,
        })),
      });

      navigate(`/hr/templates/${created.template_id}`, { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, '建立考核模板失敗。'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingOptions) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        載入建立資料中...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <div className="font-semibold">{loadError}</div>
        <button
          type="button"
          onClick={() => navigate('/hr/templates')}
          className="mt-4 rounded border border-red-200 bg-white px-4 py-2 font-medium text-red-700 hover:bg-red-50"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0B2544]">建立考核模板作業</h1>
        <p className="mt-1 text-sm text-slate-500">請依照引導步驟完成考核模板設定。</p>
      </div>

      <div className="mb-8 overflow-x-auto">
        <div className="flex min-w-max items-center px-2 py-4">
          {steps.map((item, index) => {
            const stepNumber = index + 1;
            const isCompleted = step > stepNumber;
            const isActive = step === stepNumber;

            return (
              <div key={item.title} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      isCompleted || isActive
                        ? 'bg-[#0B2544] text-white'
                        : 'border-2 border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                  </div>
                  <div
                    className={`mt-3 text-sm font-bold ${
                      isActive || isCompleted ? 'text-[#0B2544]' : 'text-slate-400'
                    }`}
                  >
                    {item.title}
                  </div>
                </div>
                {index < steps.length - 1 ? (
                  <div className={`mx-4 h-0.5 w-24 ${isCompleted ? 'bg-[#0B2544]' : 'bg-slate-200'}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="p-8">
            <h2 className="mb-2 text-xl font-bold text-slate-800">考核基本資料設定</h2>
            <p className="mb-8 text-sm text-slate-500">請填寫本次考核的基本資訊與適用範圍。</p>

            <div className="space-y-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">考核名稱</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
                  placeholder="2026 年度研發部門績效考核"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">說明</span>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
                  placeholder="描述此考核模板的用途"
                />
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">考核週期</span>
                  <select
                    value={cycleId}
                    onChange={(event) => setCycleId(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
                  >
                    {cycles.length === 0 ? <option value="">沒有可建立模板的週期</option> : null}
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">員工群組</span>
                  <select
                    value={employeeGroupId}
                    onChange={(event) => setEmployeeGroupId(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
                  >
                    {employeeGroups.length === 0 ? <option value="">沒有可選群組</option> : null}
                    {employeeGroups.map((group) => (
                      <option key={group.group_id} value={group.group_id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {submitError ? (
            <div className="mx-8 mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-b-lg border-t border-slate-200 bg-slate-50 p-6">
            <button
              type="button"
              onClick={() => navigate('/hr/templates')}
              className="px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateBasicStep()) {
                  setStep(2);
                }
              }}
              className="inline-flex items-center rounded bg-[#0B2544] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A]"
            >
              下一步
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="p-8">
            <h2 className="mb-2 text-xl font-bold text-slate-800">選擇問卷模板</h2>
            <p className="mb-8 text-sm text-slate-500">請選擇已發布的問卷模板並設定配分比例。</p>

            {assessmentTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                目前沒有已發布的問卷模板。
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-sm font-medium text-slate-700">問卷模板</div>
                  <div className="relative">
                    <button
                      type="button"
                      aria-expanded={isTemplateDropdownOpen}
                      onClick={() => setIsTemplateDropdownOpen((isOpen) => !isOpen)}
                      className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
                    >
                      <span>
                        {selectedTemplates.length > 0
                          ? `已選擇 ${selectedTemplates.length} 份問卷模板`
                          : '請勾選問卷模板'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isTemplateDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isTemplateDropdownOpen ? (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                        <div className="max-h-64 overflow-y-auto py-1">
                          {assessmentTemplates.map((template) => {
                            const isChecked = selectedTemplates.some(
                              (selected) => selected.assessmentTemplateId === template.id,
                            );

                            return (
                              <label
                                key={template.id}
                                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(event) =>
                                    updateSelectedTemplate(template.id, event.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#0B2544] focus:ring-[#0B2544]"
                                />
                                <span className="font-medium">{template.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-3">
                          <button
                            type="button"
                            onClick={() => setIsTemplateDropdownOpen(false)}
                            className="rounded border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsTemplateDropdownOpen(false)}
                            className="rounded bg-[#0B2544] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#13335A]"
                          >
                            確定
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {selectedTemplates.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    尚未選擇問卷模板。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedTemplates.map((selected) => (
                      <div
                        key={selected.assessmentTemplateId}
                        className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <FileText className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-bold text-slate-700">
                            {findAssessmentTemplateName(
                              assessmentTemplates,
                              selected.assessmentTemplateId,
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            配分比例
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={selected.weightPercent}
                              onChange={(event) =>
                                updateWeight(
                                  selected.assessmentTemplateId,
                                  Number(event.target.value),
                                )
                              }
                              className="w-24 rounded border border-slate-300 px-3 py-1.5 text-right text-sm font-medium text-slate-700 outline-none focus:border-[#0B2544] focus:ring-2 focus:ring-slate-200"
                            />
                            %
                          </label>
                          <button
                            type="button"
                            onClick={() => removeSelectedTemplate(selected.assessmentTemplateId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                            aria-label={`移除 ${findAssessmentTemplateName(
                              assessmentTemplates,
                              selected.assessmentTemplateId,
                            )}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <span className="text-sm font-bold text-slate-700">總配分比例</span>
                  <span className={`text-lg font-black ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {totalWeight}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {submitError ? (
            <div className="mx-8 mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-b-lg border-t border-slate-200 bg-slate-50 p-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center rounded px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/50 hover:text-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              上一步
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateQuestionnaireStep()) {
                  setStep(3);
                }
              }}
              className="inline-flex items-center rounded bg-[#0B2544] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A]"
            >
              下一步
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="p-8">
            <h2 className="mb-2 text-xl font-bold text-slate-800">確認發布</h2>
            <p className="mb-8 text-sm text-slate-500">確認無誤後即可建立考核模板。</p>

            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800">
                  考核基本資料
                </h3>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">考核名稱</div>
                    <div className="font-medium text-slate-800">{name}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">考核週期</div>
                    <div className="font-medium text-slate-800">
                      {cycles.find((cycle) => cycle.id === cycleId)?.name ?? cycleId}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">適用群組</div>
                    <div className="font-medium text-slate-800">
                      {employeeGroups.find((group) => group.group_id === employeeGroupId)?.name ?? employeeGroupId}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">說明</div>
                    <div className="font-medium text-slate-800">{description || '未填寫'}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800">
                  已選擇的問卷模板與配分
                </h3>
                <div className="space-y-3">
                  {selectedTemplates.map((template) => (
                    <div
                      key={template.assessmentTemplateId}
                      className="flex items-center justify-between text-sm font-medium text-slate-700"
                    >
                      <div className="flex items-center">
                        <div className="mr-3 h-1.5 w-1.5 rounded-full bg-[#0B2544]" />
                        {findAssessmentTemplateName(assessmentTemplates, template.assessmentTemplateId)}
                      </div>
                      <span className="font-bold text-[#0B2544]">{template.weightPercent}%</span>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-800">
                    <span>總計</span>
                    <span className={totalWeight === 100 ? 'text-emerald-600' : 'text-red-500'}>{totalWeight}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {submitError ? (
            <div className="mx-8 mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-b-lg border-t border-slate-200 bg-slate-50 p-6">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center rounded px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/50 hover:text-slate-800"
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              上一步
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex items-center rounded bg-[#0B2544] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#13335A] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              確認發布
            </button>
          </div>
        </div>
      ) : null}

      {selectedTemplates.length > 0 && step === 2 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedTemplates.map((template) => (
            <button
              key={template.assessmentTemplateId}
              type="button"
              onClick={() => removeSelectedTemplate(template.assessmentTemplateId)}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {findAssessmentTemplateName(assessmentTemplates, template.assessmentTemplateId)}
              <X className="ml-2 h-3 w-3" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
