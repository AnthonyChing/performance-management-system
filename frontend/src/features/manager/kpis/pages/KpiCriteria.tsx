import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Plus,
  Users,
  ChevronDown,
  AlertCircle,
  BarChart3,
  Loader2,
  Search,
  Percent,
} from 'lucide-react';
import {
  loadSubordinates,
  loadKpisForEmployee,
  createKpiCriterion,
  updateKpiCriterion,
  deleteKpiCriterion,
} from '../api';
import { getCurrentPerformanceCycle } from '../../../../api/employee';
import type { Subordinate, KpiCriterion } from '../api';
import CreateKpiModal from '../components/CreateKpiModal';
import KpiCriterionCard from '../components/KpiCriterionCard';

export default function KpiCriteria() {
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [kpis, setKpis] = useState<KpiCriterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiCriterion | null>(null);

  // Form fields
  const [formSubordinate, setFormSubordinate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formKpiType, setFormKpiType] = useState<'individual' | 'team'>('individual');
  const [formUnit, setFormUnit] = useState('');
  const [formTargetOperator, setFormTargetOperator] = useState('');
  const [formTargetValue, setFormTargetValue] = useState('');
  const [formTargetUnit, setFormTargetUnit] = useState('');
  const [formTargetDisplayText, setFormTargetDisplayText] = useState('');
  const [formWeight, setFormWeight] = useState('');

  // Delete confirm
  const [deletingKpiId, setDeletingKpiId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSubordinates().then((subs) => {
      setSubordinates(subs);
      if (subs.length > 0) {
        setSelectedEmployee(subs[0].id);
      }
      setIsLoading(false);
    });

    getCurrentPerformanceCycle().then((res) => {
      if (res.cycle) {
        const now = new Date();
        const start = res.cycle.manager_eval_start ? new Date(res.cycle.manager_eval_start) : null;
        const end = res.cycle.manager_eval_end ? new Date(res.cycle.manager_eval_end) : null;
        if (start && end && now >= start && now <= end) {
          setIsEvaluationOpen(true);
        } else {
          setIsEvaluationOpen(false);
        }
      }
    }).catch(() => {
      // Ignore if no active cycle
    });
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      setIsLoadingKpis(true);
      loadKpisForEmployee(selectedEmployee).then((list) => {
        setKpis(list);
        setIsLoadingKpis(false);
      });
    }
  }, [selectedEmployee]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormKpiType('individual');
    setFormUnit('');
    setFormTargetOperator('');
    setFormTargetValue('');
    setFormTargetUnit('');
    setFormTargetDisplayText('');
    setFormWeight('');
    setFormSubordinate(selectedEmployee);
    setEditingKpi(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (kpi: KpiCriterion) => {
    setEditingKpi(kpi);
    setFormTitle(kpi.title);
    setFormDescription(kpi.description || '');
    setFormKpiType(kpi.kpiType);
    setFormUnit(kpi.unit || '');
    setFormTargetOperator(kpi.targetOperator || '');
    setFormTargetValue(kpi.targetValue !== null ? String(kpi.targetValue) : String(kpi.assignmentTargetValue));
    setFormTargetUnit(kpi.targetUnit || '');
    setFormTargetDisplayText(kpi.targetDisplayText || '');
    setFormWeight(String(kpi.weight));
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetVal = parseFloat(formTargetValue);
    if (isNaN(targetVal)) return;

    if (editingKpi) {
      const result = await updateKpiCriterion(selectedEmployee, editingKpi.id, {
        title: formTitle,
        description: formDescription || undefined,
        kpi_type: formKpiType,
        unit: formUnit || undefined,
        target_value: targetVal,
        target_operator: formTargetOperator || undefined,
        target_unit: formTargetUnit || undefined,
        target_display_text: formTargetDisplayText || undefined,
        weight: parseFloat(formWeight) || 0,
      });
      if (result) {
        showToast('KPI 準則已更新成功', 'success');
        const refreshed = await loadKpisForEmployee(selectedEmployee);
        setKpis(refreshed);
      } else {
        showToast('更新失敗，請稍後再試', 'error');
      }
    } else {
      const employeeId = formSubordinate || selectedEmployee;
      const result = await createKpiCriterion(employeeId, {
        title: formTitle,
        description: formDescription || undefined,
        kpi_type: formKpiType,
        unit: formUnit || undefined,
        target_value: targetVal,
        target_operator: formTargetOperator || undefined,
        target_unit: formTargetUnit || undefined,
        target_display_text: formTargetDisplayText || undefined,
        weight: parseFloat(formWeight) || 0,
      });
      if (result) {
        showToast('KPI 準則已建立成功', 'success');
        // If we created for a different employee, switch to them
        if (employeeId !== selectedEmployee) {
          setSelectedEmployee(employeeId);
        } else {
          const refreshed = await loadKpisForEmployee(selectedEmployee);
          setKpis(refreshed);
        }
      } else {
        showToast('建立失敗，請稍後再試', 'error');
      }
    }
    setShowModal(false);
    resetForm();
  };

  const handleUpdateCurrentValue = async (kpiId: string, newValue: number) => {
    const ok = await updateKpiCriterion(selectedEmployee, kpiId, { current_value: newValue });
    if (ok) {
      showToast('KPI 數值已更新', 'success');
      const refreshed = await loadKpisForEmployee(selectedEmployee);
      setKpis(refreshed);
    } else {
      showToast('更新失敗，請稍後再試', 'error');
    }
  };

  const handleDelete = async (kpiId: string) => {
    setDeletingKpiId(kpiId);
  };

  const confirmDelete = async () => {
    if (!deletingKpiId) return;
    const ok = await deleteKpiCriterion(selectedEmployee, deletingKpiId);
    if (ok) {
      showToast('KPI 已刪除', 'success');
      const refreshed = await loadKpisForEmployee(selectedEmployee);
      setKpis(refreshed);
    } else {
      showToast('刪除失敗', 'error');
    }
    setDeletingKpiId(null);
  };

  // Filtered KPIs
  const filteredKpis = kpis.filter((k) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      k.title.toLowerCase().includes(q) ||
      (k.description && k.description.toLowerCase().includes(q))
    );
  });

  const totalWeight = kpis.reduce((sum, k) => sum + k.weight, 0);
  const selectedSub = subordinates.find((s) => s.id === selectedEmployee);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-500" />
            KPI 設定與評估
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            為直屬員工設定 KPI 考核指標、衡量標準與權重配置。每項 KPI 代表一個可量化的績效衡量依據。
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          新增 KPI 準則
        </button>
      </div>

      {/* Employee Selector + Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Employee Picker */}
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              選擇員工
            </label>
            <div className="relative">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full appearance-none bg-slate-50 text-sm text-slate-700 rounded-lg pl-3 pr-8 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              >
                {subordinates.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.jobTitle}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              搜尋 KPI
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋 KPI 名稱或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-sm text-slate-700 rounded-lg pl-9 pr-4 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 justify-end">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800 font-mono">{kpis.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold">KPI 項目</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div
                className={`text-lg font-bold font-mono ${
                  totalWeight === 100
                    ? 'text-emerald-600'
                    : totalWeight > 100
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {totalWeight}%
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">權重總計</div>
            </div>
          </div>
        </div>

        {/* Weight Warning */}
        {totalWeight > 0 && totalWeight !== 100 && (
          <div
            className={`mt-3 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
              totalWeight > 100
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {totalWeight > 100
              ? `權重總和 ${totalWeight}% 超過 100%，請調整各項權重`
              : `權重總和 ${totalWeight}% 尚未達到 100%，建議分配至滿額`}
          </div>
        )}
      </div>

      {/* KPI Grid */}
      {isLoadingKpis ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <span className="ml-3 text-sm text-slate-500">載入 KPI 資料中...</span>
        </div>
      ) : filteredKpis.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">
            {searchQuery ? '找不到符合條件的 KPI' : '尚未設定 KPI 準則'}
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {searchQuery
              ? '請嘗試不同的搜尋關鍵字'
              : selectedSub
              ? `尚未為 ${selectedSub.name} 設定任何 KPI 考核指標。點擊上方「新增 KPI 準則」按鈕開始設定。`
              : '請先選擇員工後設定 KPI'}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              新增第一個 KPI
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredKpis.map((kpi) => (
              <motion.div
                key={kpi.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <KpiCriterionCard
                  kpi={kpi}
                  employeeName={selectedSub?.name || ''}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  isEvaluationOpen={isEvaluationOpen}
                  onUpdateCurrentValue={handleUpdateCurrentValue}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <CreateKpiModal
          subordinates={subordinates}
          selectedSubordinateId={formSubordinate || selectedEmployee}
          onSubordinateChange={setFormSubordinate}
          title={formTitle}
          description={formDescription}
          kpiType={formKpiType}
          unit={formUnit}
          targetValue={formTargetValue}
          weight={formWeight}
          onTitleChange={setFormTitle}
          onDescriptionChange={setFormDescription}
          onKpiTypeChange={setFormKpiType}
          onUnitChange={setFormUnit}
          onTargetValueChange={setFormTargetValue}
          onWeightChange={setFormWeight}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          isEditing={!!editingKpi}
        />
      )}

      {/* Delete Confirmation */}
      {deletingKpiId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">確認刪除 KPI</h3>
                <p className="text-xs text-slate-500 mt-0.5">此操作無法復原，確定要刪除此 KPI 準則嗎？</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingKpiId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
              >
                確認刪除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
