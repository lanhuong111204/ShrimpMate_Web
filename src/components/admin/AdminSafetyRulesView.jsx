import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Power
} from 'lucide-react';
import { safetyRuleService } from '../../services/safetyRuleService';
import { getErrorMessage } from '../../services/apiClient';

export const AdminSafetyRulesView = () => {
  const [rules, setRules] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modal thêm luật mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [priority] = useState('1');
  const [field, setField] = useState('dissolvedOxygenMgL');
  const [operator, setOperator] = useState('<');
  const [value, setValue] = useState('3.5');
  const [decision, setDecision] = useState('blocked');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = async () => {
    setErrorMessage('');
    try {
      const res = await safetyRuleService.getSafetyRules();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setRules(list);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi nạp danh mục quy tắc an toàn!'));
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#EA580C] rounded-full inline-block"></span>
            <h1 className="font-bold text-base md:text-lg text-[#0B1C30] tracking-tight">
              Quy tắc an toàn nước toàn cục (Safety Rule Engine)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập ngưỡng DO, pH, Nhiệt độ và NH₃ áp dụng cho toàn bộ máy cho ăn trên hệ thống để chặn xả cám khi môi trường nguy hiểm.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo quy tắc mới</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3.5 bg-[#E8F5E9] border border-[#7CF994] text-[#006E2D] rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#006E2D] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-[#FFDAD6]/60 border border-[#BA1A1A]/30 text-[#93000A] rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
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
                rule.isEnabled
                  ? isBlocked
                    ? 'border-slate-200/80 border-l-4 border-l-[#BA1A1A]'
                    : 'border-slate-200/80 border-l-4 border-l-[#F59E0B]'
                  : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-xs text-[#0B1C30]">{rule.code}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-bold uppercase ${
                        isBlocked
                          ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}
                    >
                      {isBlocked ? 'CẤM XẢ CÁM (BLOCKED)' : 'GIẢM ĐỊNH MỨC (ADJUSTED)'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1C30]">{rule.name}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${
                      rule.isEnabled
                        ? 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                    title={rule.isEnabled ? 'Đang bật - Bấm để tắt' : 'Đang tắt - Bấm để bật'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule)}
                    className="p-1.5 rounded-xl border border-[#FFDAD6] text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition cursor-pointer"
                    title="Xóa luật"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Điều kiện */}
              <div className="p-3 bg-[#F8F9FF] rounded-xl border border-slate-200/80 font-mono-num text-xs text-[#0B1C30] flex items-center justify-between">
                <span className="text-slate-500">Điều kiện kích hoạt:</span>
                <strong className="text-[#EA580C]">
                  {rule.condition?.field} {rule.condition?.operator} {rule.condition?.value}
                </strong>
              </div>

              {/* Lý do hành động */}
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {rule.action?.reason}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. MODAL THÊM QUY TẮC MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-[#0B1C30] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#7CF994]" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  Khai báo quy tắc an toàn nước
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Mã quy tắc (Code) <span className="text-[#BA1A1A]">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: DO_CRITICAL_BLOCKED"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C] font-mono-num uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Tên diễn giải <span className="text-[#BA1A1A]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Chặn cho ăn khi DO dưới 3.5 mg/L"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  required
                />
              </div>

              {/* Điều kiện */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#0B1C30] mb-1">
                    Chỉ số
                  </label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full px-2 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none font-mono-num"
                  >
                    <option value="dissolvedOxygenMgL">DO (Oxy)</option>
                    <option value="ph">pH (Kiềm)</option>
                    <option value="temperatureC">Nhiệt độ</option>
                    <option value="ammoniaMgL">NH3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B1C30] mb-1">
                    Toán tử
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-2 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none font-mono-num"
                  >
                    <option value="<">&lt; (Bé hơn)</option>
                    <option value=">">&gt; (Lớn hơn)</option>
                    <option value="<=">&le; (Bé hơn hoặc bằng)</option>
                    <option value=">=">&ge; (Lớn hơn hoặc bằng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B1C30] mb-1">
                    Ngưỡng đo
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-2.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none font-mono-num"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Hành động khóa an toàn
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="blocked">Cấm xả thức ăn (Blocked - Không phát MQTT)</option>
                  <option value="adjusted">Giảm định mức an toàn (Adjusted)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Lý do cấm / điều chỉnh <span className="text-[#BA1A1A]">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Nồng độ oxy hòa tan quá thấp (< 3.5 mg/L). Cấm cho ăn để tránh tôm bị ngạt và ô nhiễm đáy ao."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kích hoạt quy tắc</span>
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
