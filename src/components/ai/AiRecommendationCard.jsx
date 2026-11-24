import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCw,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

const SAFETY_BADGE_MAP = {
  allowed: {
    label: 'TỐI ƯU',
    badgeClass: 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]',
  },
  adjusted: {
    label: 'ĐÃ ĐIỀU CHỈNH AN TOÀN',
    badgeClass: 'bg-amber-100 text-[#9D4300] border border-amber-300',
  },
  blocked: {
    label: 'ĐÃ KHÓA AN TOÀN',
    badgeClass: 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30',
  },
};

export const AiRecommendationCard = ({
  recommendation,
  onPredict,
  onApply,
  isPredicting = false,
  isApplying = false,
  canApply = true,
}) => {
  if (!recommendation) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-[#FFF8F5] to-white p-5 shadow-2xs flex flex-col justify-between gap-4 h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Khuyến nghị Khẩu phần AI (XGBoost + TreeSHAP)
              </h3>
              <p className="text-xs text-slate-500">
                Chưa có bản ghi dự báo AI gần đây cho ao nuôi này
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-orange-100">
          Hệ thống AI phân tích 7 đặc trưng nông học & môi trường (DOC, ABW, DO min, ΔTAN, mưa sáng, lượng ăn cữ trước, lượng nước thay) kết hợp kiểm duyệt qua Safety Rule Engine.
        </p>

        <button
          type="button"
          onClick={onPredict}
          disabled={isPredicting}
          className="w-full h-10 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <RotateCw className={`w-4 h-4 ${isPredicting ? 'animate-spin' : ''}`} />
          <span>{isPredicting ? 'Đang chạy mô hình AI...' : 'Chạy dự báo AI (XGBoost)'}</span>
        </button>
      </div>
    );
  }

  const contributions =
    recommendation.featureContributions ||
    recommendation.inputSnapshot?.featureContributions ||
    [];
  const baseValueKg =
    recommendation.baseValueKg ?? recommendation.inputSnapshot?.baseValueKg ?? null;
  const predictedKg = Number(recommendation.predictedFeedAmountKg ?? 0);
  const safeAllowedKg =
    recommendation.safeAllowedAmountKg !== undefined &&
    recommendation.safeAllowedAmountKg !== null
      ? Number(recommendation.safeAllowedAmountKg)
      : predictedKg;
  const safetyDecision = String(recommendation.safetyDecision || 'allowed').toLowerCase();
  const safetyBadge = SAFETY_BADGE_MAP[safetyDecision] || SAFETY_BADGE_MAP.allowed;
  const safetyReasonText =
    recommendation.safetyReason ||
    (Array.isArray(recommendation.safetyReasons)
      ? recommendation.safetyReasons.join('; ')
      : '');
  const isBlocked = safetyDecision === 'blocked';

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-[#FFF8F5] via-white to-amber-50/40 p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Khuyến nghị Khẩu phần AI ({recommendation.modelName || 'XGBoost-Regressor'})
              </h3>
              <p className="text-[11px] text-slate-500 font-mono-num">
                {recommendation.modelVersion || 'v2.0.0'} • TreeSHAP XAI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${safetyBadge.badgeClass}`}>
              {safetyBadge.label}
            </span>
            <button
              type="button"
              onClick={onPredict}
              disabled={isPredicting}
              className="h-7 px-2.5 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 text-[#9D4300] text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              title="Chạy lại dự báo AI với số liệu mới nhất"
            >
              <RotateCw className={`w-3 h-3 ${isPredicting ? 'animate-spin' : ''}`} />
              <span>{isPredicting ? 'Đang tính...' : 'Dự báo mới'}</span>
            </button>
          </div>
        </div>

        {/* Predicted Amount */}
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="text-3xl font-extrabold text-[#EA580C] font-mono-num">
            {safeAllowedKg.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-600">kg / cữ</span>
          {safetyDecision === 'adjusted' && safeAllowedKg !== predictedKg && (
            <span className="text-xs text-amber-800 font-mono-num bg-amber-100/80 px-2 py-0.5 rounded-md">
              Mô hình gốc: {predictedKg.toFixed(2)} kg
            </span>
          )}
          {baseValueKg !== null && baseValueKg !== undefined && (
            <span className="text-xs text-slate-500 font-mono-num">
              (Mốc cơ sở: {Number(baseValueKg).toFixed(2)} kg)
            </span>
          )}
        </div>

        {/* Agronomic Explanation */}
        {recommendation.explanation && (
          <div className="p-3 rounded-xl bg-white/90 border border-orange-100 text-xs text-slate-700 leading-relaxed">
            {recommendation.explanation}
          </div>
        )}

        {/* Safety Reason Alert if adjusted or blocked */}
        {safetyDecision !== 'allowed' && safetyReasonText && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              isBlocked
                ? 'bg-[#FFF8F8] border-[#FFDAD6] text-[#BA1A1A]'
                : 'bg-amber-50 border-amber-200 text-[#9D4300]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Safety Engine:</strong> {safetyReasonText}
            </span>
          </div>
        )}

        {/* TreeSHAP Feature Contributions */}
        {contributions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Yếu tố chi phối khẩu phần (TreeSHAP XAI):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {contributions.map((item, idx) => {
                const deltaNum = Number(item.deltaKg || 0);
                const deltaText = `${deltaNum > 0 ? '+' : ''}${deltaNum.toFixed(2)} kg`;
                const pillStyle =
                  item.impact === 'INCREASE'
                    ? 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]'
                    : item.impact === 'DECREASE'
                    ? 'bg-[#FFDAD6]/70 text-[#BA1A1A] border-[#BA1A1A]/30'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <span
                    key={`${item.feature || item.name}-${idx}`}
                    title={`${item.name}${item.value !== undefined ? ` (${item.value})` : ''}: ${item.description || ''}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold font-mono-num ${pillStyle}`}
                  >
                    {item.impact === 'INCREASE' && <TrendingUp className="w-3 h-3 shrink-0" />}
                    {item.impact === 'DECREASE' && <TrendingDown className="w-3 h-3 shrink-0" />}
                    {item.impact !== 'INCREASE' && item.impact !== 'DECREASE' && (
                      <Minus className="w-3 h-3 shrink-0" />
                    )}
                    <span className="font-sans">{item.name}:</span>
                    <strong>{deltaText}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={() => onApply?.(safeAllowedKg)}
        disabled={isBlocked || isApplying || !canApply}
        className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
          isBlocked || !canApply
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs'
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>
          {isBlocked
            ? 'Không thể áp dụng (Vi phạm an toàn nước)'
            : !canApply
            ? 'Chỉ Quản lý (Manager) được thêm vào lịch tự động'
            : `Áp dụng mức ${safeAllowedKg.toFixed(1)} kg vào cữ ăn`}
        </span>
      </button>
    </div>
  );
};

export default AiRecommendationCard;
