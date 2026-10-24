import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Power,
  Sliders,
  Scale
} from 'lucide-react';
import { safetyRuleService } from '../../services/safetyRuleService';
import { getErrorMessage } from '../../services/apiClient';

export const AdminSafetyRulesView = () => {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modal thêm luật mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('1');
  const [field, setField] = useState('dissolvedOxygenMgL');
  const [operator, setOperator] = useState('<');
  const [value, setValue] = useState('3.5');
  const [decision, setDecision] = useState('blocked');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await safetyRuleService.getSafetyRules();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setRules(list);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi nạp danh mục quy tắc an toàn!'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (rule) => {
    const nextEnabled = !rule.isEnabled;
    try {
      await safetyRuleService.updateSafetyRule(rule.id, { isEnabled: nextEnabled });
      setSuccessToast(`Đã ${nextEnabled ? 'kích hoạt' : 'vô hiệu hóa'} luật [${rule.code}].`);
      await fetchRules();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi cập nhật trạng thái luật an toàn!'));
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !reason.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin quy tắc an toàn!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await safetyRuleService.createSafetyRule({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        priority: Number(priority),
        isEnabled: true,
        condition: {
          field,
          operator,
          value: Number(value),
        },
        action: {
          decision,
          reason: reason.trim(),
        },
      });

      setSuccessToast(`Đã thiết lập luật an toàn [${code.trim()}] thành công.`);
      setIsModalOpen(false);
      setCode('');
      setName('');
      setReason('');
      await fetchRules();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi tạo quy tắc an toàn!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (rule) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa luật an toàn [${rule.name}]?`)) {
      return;
    }

    try {
      await safetyRuleService.deleteSafetyRule(rule.id);
      setSuccessToast(`Đã xóa luật [${rule.code}].`);
      await fetchRules();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi xóa luật an toàn!'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              QUY TẮC AN TOÀN NƯỚC TOÀN CỤC (SAFETY RULE ENGINE)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Thiết lập ngưỡng DO, pH, Nhiệt độ và NH₃ áp dụng cho toàn bộ máy cho ăn trên hệ thống để chặn xả cám khi nước xấu.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Tạo Quy Tắc Mới</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Danh sách Quy tắc */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const isBlocked = rule.action?.decision === 'blocked';
          return (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl border transition shadow-sm space-y-3 bg-white ${
                rule.isEnabled ? 'border-neutral-200' : 'border-neutral-200 opacity-60 bg-neutral-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-xs text-neutral-900">{rule.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-bold uppercase ${
                        isBlocked ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isBlocked ? 'CẤM XẢ CÁM (BLOCKED)' : 'GIẢM ĐỊNH MỨC (ADJUSTED)'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-neutral-800">{rule.name}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      rule.isEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                    }`}
                    title={rule.isEnabled ? 'Đang bật - Bấm để tắt' : 'Đang tắt - Bấm để bật'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Xóa luật"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Điều kiện */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 font-mono-num text-xs text-neutral-700 flex items-center justify-between">
                <span>Điều kiện kích hoạt:</span>
                <strong>
                  {rule.condition?.field} {rule.condition?.operator} {rule.condition?.value}
                </strong>
              </div>

              {/* Lý do hành động */}
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                {rule.action?.reason}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. MODAL THÊM QUY TẮC MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden">
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  Khai Báo Quy Tắc An Toàn Nước
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Mã Quy Tắc (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ví dụ: DO_CRITICAL_BLOCKED"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Tên Diễn Giải <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ví dụ: Chặn cho ăn khi DO dưới 3.5 mg/L"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              {/* Điều kiện */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1 font-mono-num">
                    Chỉ Số
                  </label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full px-2 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none bg-white font-mono-num"
                  >
                    <option value="dissolvedOxygenMgL">DO (Oxy)</option>
                    <option value="ph">pH (Kiềm)</option>
                    <option value="temperatureC">Nhiệt độ</option>
                    <option value="ammoniaMgL">NH3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1 font-mono-num">
                    Toán Tử
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-2 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none bg-white font-mono-num"
                  >
                    <option value="<">&lt; (Bé hơn)</option>
                    <option value=">">&gt; (Lớn hơn)</option>
                    <option value="<=">&le; (Bé hơn hoặc bằng)</option>
                    <option value=">=">&ge; (Lớn hơn hoặc bằng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1 font-mono-num">
                    Ngưỡng Đo
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-2 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none font-mono-num"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Hành Động Khóa An Toàn
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none bg-white"
                >
                  <option value="blocked">Cấm xả thức ăn (Blocked - Không phát MQTT)</option>
                  <option value="adjusted">Giảm định mức an toàn (Adjusted)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Lý Do Cấm / Điều Chỉnh <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="ví dụ: Nồng độ oxy hòa tan quá thấp (< 3.5 mg/L). Cấm cho ăn để tránh tôm bị ngạt và ô nhiễm đáy ao."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kích Hoạt Quy Tắc</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSafetyRulesView;
