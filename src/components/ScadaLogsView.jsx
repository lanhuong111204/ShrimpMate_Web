import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Download,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Filter,
  Cpu,
  Lightbulb,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Bell,
  Utensils,
  ShieldAlert,
} from 'lucide-react';
import { alertService } from '../services/alertService';
import { getErrorMessage } from '../services/apiClient';
import {
  getSeverityMeta,
  getAlertStatusMeta,
  mapAlertToLogItem,
} from '../utils/alertHelpers';

const PAGE_LIMIT = 20;

export const ScadaLogsView = ({
  logs = [],
  ponds = [],
  selectedFarmId = 'all',
  alertRefreshKey = 0,
  onAlertsChanged,
  onShowToast,
  onExport,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const severityFilter = searchParams.get('severity') || '';

  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'feeding'
  const [pondFilter, setPondFilter] = useState('');
  const [feedingSubFilter, setFeedingSubFilter] = useState('all'); // 'all' | 'blocked' | 'completed'
  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(1);
  const [alertItems, setAlertItems] = useState([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [alertFetchError, setAlertFetchError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const pondIdsKey = ponds.map((p) => p.id).join(',');
  const effectivePondFilter =
    pondFilter && ponds.some((p) => p.id === pondFilter) ? pondFilter : '';

  const updateAlertQueryParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const fetchAlertsPage = useCallback(async () => {
    setIsLoadingAlerts(true);
    setAlertFetchError('');
    try {
      const pondIdList = pondIdsKey ? pondIdsKey.split(',').filter(Boolean) : [];

      if (selectedFarmId !== 'all' && pondIdList.length === 0) {
        setAlertItems([]);
        setTotalAlerts(0);
        setTotalPages(1);
        return;
      }

      const baseParams = {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(severityFilter ? { severity: Number(severityFilter) } : {}),
      };

      // Trường hợp chọn ao cụ thể, xem tất cả trang trại, hoặc trang trại chỉ có 1 ao: gọi thẳng GET /alerts có phân trang từ Backend
      if (effectivePondFilter || selectedFarmId === 'all' || pondIdList.length === 1) {
        const scopedPondId =
          effectivePondFilter || (selectedFarmId !== 'all' ? pondIdList[0] : '');
        const res = await alertService.getAlerts({
          ...baseParams,
          ...(scopedPondId ? { pondId: scopedPondId } : {}),
          page,
          limit: PAGE_LIMIT,
        });

        const rawData = Array.isArray(res) ? res : res?.data || [];
        const total = Number(res?.total ?? rawData.length);
        const pages = Math.max(1, Number(res?.totalPages ?? Math.ceil(total / PAGE_LIMIT)));

        setAlertItems(rawData.map(mapAlertToLogItem));
        setTotalAlerts(total);
        setTotalPages(pages);
        return;
      }

      // Trang trại đang chọn có nhiều ao: lấy cảnh báo theo từng ao thuộc trang trại và gộp chuẩn thứ tự mới nhất
      const perPondResponses = await Promise.all(
        pondIdList.map((pId) =>
          alertService.getAlerts({
            ...baseParams,
            pondId: pId,
            page: 1,
            limit: 50,
          })
        )
      );

      const seenIds = new Set();
      const merged = [];
      let sumTotal = 0;

      perPondResponses.forEach((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        sumTotal += Number(res?.total ?? list.length);
        list.forEach((item) => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            merged.push(mapAlertToLogItem(item));
          }
        });
      });

      merged.sort((a, b) => b.rawTime - a.rawTime);
      const computedTotal = Math.max(merged.length, sumTotal);
      const computedPages = Math.max(1, Math.ceil(merged.length / PAGE_LIMIT));
      const startIdx = (page - 1) * PAGE_LIMIT;

      setAlertItems(merged.slice(startIdx, startIdx + PAGE_LIMIT));
      setTotalAlerts(computedTotal);
      setTotalPages(computedPages);
    } catch (err) {
      setAlertFetchError(getErrorMessage(err, 'Không thể tải danh sách cảnh báo từ máy chủ.'));
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [
    selectedFarmId,
    pondIdsKey,
    effectivePondFilter,
    statusFilter,
    severityFilter,
    page,
  ]);

  useEffect(() => {
    if (activeTab !== 'alerts') return undefined;
    const timer = setTimeout(() => {
      fetchAlertsPage();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchAlertsPage, alertRefreshKey]);

  const handleAcknowledge = async (alertId) => {
    setActionLoadingId(alertId);
    try {
      await alertService.acknowledgeAlert(alertId);
      onShowToast?.('Đã xác nhận tiếp nhận xử lý cảnh báo.', 'info');
      await fetchAlertsPage();
      onAlertsChanged?.();
    } catch (err) {
      onShowToast?.(getErrorMessage(err, 'Không thể xác nhận tiếp nhận cảnh báo.'), 'alert');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (alertId) => {
    setActionLoadingId(alertId);
    try {
      await alertService.resolveAlert(alertId);
      onShowToast?.('Đã đánh dấu xử lý xong sự cố.', 'success');
      await fetchAlertsPage();
      onAlertsChanged?.();
    } catch (err) {
      onShowToast?.(getErrorMessage(err, 'Không thể đánh dấu hoàn tất cảnh báo.'), 'alert');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Lọc tìm kiếm cục bộ cho trang cảnh báo đang hiển thị
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleAlerts = alertItems.filter((item) => {
    if (!normalizedSearch) return true;
    return (
      (item.title || '').toLowerCase().includes(normalizedSearch) ||
      (item.message || '').toLowerCase().includes(normalizedSearch) ||
      (item.pondCode || '').toLowerCase().includes(normalizedSearch) ||
      (item.pondName || '').toLowerCase().includes(normalizedSearch) ||
      (item.deviceName || '').toLowerCase().includes(normalizedSearch) ||
      (item.deviceUid || '').toLowerCase().includes(normalizedSearch) ||
      (item.actionRecommendation || '').toLowerCase().includes(normalizedSearch)
    );
  });

  // Dữ liệu tab Nhật ký cho ăn & Safety Rule Engine
  const feedingLogs = logs.filter((l) => l.kind === 'feeding');
  const visibleFeedingLogs = feedingLogs.filter((l) => {
    if (effectivePondFilter && l.pondId !== effectivePondFilter) return false;
    if (feedingSubFilter === 'blocked' && l.type !== 'alert') return false;
    if (feedingSubFilter === 'completed' && l.type === 'alert') return false;
    if (!normalizedSearch) return true;
    return (
      (l.title || '').toLowerCase().includes(normalizedSearch) ||
      (l.message || '').toLowerCase().includes(normalizedSearch) ||
      (l.pondCode || '').toLowerCase().includes(normalizedSearch) ||
      (l.pondName || '').toLowerCase().includes(normalizedSearch)
    );
  });

  const displayedForExport = activeTab === 'alerts' ? visibleAlerts : visibleFeedingLogs;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Nhật ký vận hành & Cảnh báo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi sự cố môi trường, thiết bị theo phân quyền trang trại và lịch sử Safety Rule Engine.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'alerts' && (
            <button
              onClick={fetchAlertsPage}
              disabled={isLoadingAlerts}
              className="h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-[#0B1C30] border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#006398] ${isLoadingAlerts ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          )}

          <button
            onClick={() => onExport?.(displayedForExport)}
            className="h-9 px-3.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border ${
            activeTab === 'alerts'
              ? 'bg-[#0B1C30] text-white border-[#0B1C30] shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Cảnh báo hệ thống ({totalAlerts})</span>
        </button>

        <button
          onClick={() => setActiveTab('feeding')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border ${
            activeTab === 'feeding'
              ? 'bg-[#0B1C30] text-white border-[#0B1C30] shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Nhật ký cho ăn & Safety ({feedingLogs.length})</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        {activeTab === 'alerts' ? (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Filter className="w-4 h-4 text-[#006398] shrink-0" />

              {/* Status Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: '', label: 'Tất cả trạng thái', active: 'bg-[#0B1C30] text-white' },
                  { value: 'open', label: 'Chưa xử lý', active: 'bg-[#BA1A1A] text-white' },
                  { value: 'acknowledged', label: 'Đã tiếp nhận', active: 'bg-[#EA580C] text-white' },
                  { value: 'resolved', label: 'Đã xử lý', active: 'bg-[#006E2D] text-white' },
                ].map((opt) => (
                  <button
                    key={opt.value || 'all-status'}
                    onClick={() => updateAlertQueryParam('status', opt.value)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      statusFilter === opt.value
                        ? opt.active
                        : 'bg-[#F8F9FF] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Severity Select */}
              <select
                value={severityFilter}
                onChange={(e) => updateAlertQueryParam('severity', e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-[#F8F9FF] font-semibold text-[#0B1C30] focus:outline-none focus:border-[#006398] cursor-pointer"
                title="Lọc theo mức độ cảnh báo"
              >
                <option value="">Mọi mức độ</option>
                <option value="3">Mức 3 - Nguy cấp (CRITICAL)</option>
                <option value="2">Mức 2 - Cảnh báo (WARNING)</option>
                <option value="1">Mức 1 - Theo dõi (INFO)</option>
              </select>

              {/* Pond Select */}
              <select
                value={effectivePondFilter}
                onChange={(e) => {
                  setPondFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-[#F8F9FF] font-semibold text-[#0B1C30] focus:outline-none focus:border-[#006398] cursor-pointer max-w-[200px]"
                title="Lọc theo ao nuôi"
              >
                <option value="">Tất cả ao ({ponds.length})</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>

              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm sự kiện, thiết bị, mã ao..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs w-full sm:w-56 focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-[#006398]" />
              {[
                { value: 'all', label: `Tất cả (${feedingLogs.length})`, active: 'bg-[#0B1C30] text-white' },
                {
                  value: 'blocked',
                  label: `Chặn an toàn (${feedingLogs.filter((l) => l.type === 'alert').length})`,
                  active: 'bg-[#EA580C] text-white',
                },
                {
                  value: 'completed',
                  label: `Cho ăn bình thường (${feedingLogs.filter((l) => l.type !== 'alert').length})`,
                  active: 'bg-[#006E2D] text-white',
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFeedingSubFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    feedingSubFilter === opt.value
                      ? opt.active
                      : 'bg-[#F8F9FF] text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={effectivePondFilter}
                onChange={(e) => setPondFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-[#F8F9FF] font-semibold text-[#0B1C30] focus:outline-none focus:border-[#006398] cursor-pointer"
              >
                <option value="">Tất cả ao ({ponds.length})</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm lệnh cho ăn, mã ao..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs w-full sm:w-56 focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'alerts' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {alertFetchError && (
            <div className="m-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{alertFetchError}</span>
            </div>
          )}

          {isLoadingAlerts && visibleAlerts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Đang tải danh sách cảnh báo từ máy chủ...
            </div>
          ) : visibleAlerts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Không có cảnh báo nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {visibleAlerts.map((item) => {
                const sevMeta = getSeverityMeta(item.severityLevel);
                const statusMeta = getAlertStatusMeta(item.status);
                const pondLabel = item.pondCode
                  ? item.pondName
                    ? `${item.pondCode} • ${item.pondName}`
                    : item.pondCode
                  : item.pondId;
                const isBusy = actionLoadingId === item.alertId;

                return (
                  <div
                    key={item.id}
                    className={`p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition ${sevMeta.cardClass}`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {item.severityLevel === 3 ? (
                        <AlertOctagon className={`w-4 h-4 mt-0.5 shrink-0 ${sevMeta.iconClass}`} />
                      ) : item.severityLevel === 2 ? (
                        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${sevMeta.iconClass}`} />
                      ) : (
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${sevMeta.iconClass}`} />
                      )}

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${sevMeta.titleClass}`}>
                            {item.rawType?.toUpperCase() || item.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${sevMeta.badgeClass}`}>
                            {sevMeta.shortLabel} (Mức {item.severityLevel})
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                          {pondLabel && (
                            <span className="px-2 py-0.5 rounded-full bg-[#EFF4FF] text-[#006398] font-mono-num font-bold text-[11px]">
                              {pondLabel}
                            </span>
                          )}
                          {(item.deviceName || item.deviceUid) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[11px] font-medium">
                              <Cpu className="w-3 h-3 text-[#006398]" />
                              <span>
                                {item.deviceName || item.deviceUid}
                                {item.deviceName && item.deviceUid ? ` (${item.deviceUid})` : ''}
                              </span>
                            </span>
                          )}
                        </div>

                        <p className="text-slate-700 leading-relaxed">{item.message}</p>

                        {item.actionRecommendation && (
                          <div className="inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-[#0B1C30] text-[11px]">
                            <Lightbulb className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
                            <span>
                              <strong>Khuyến nghị:</strong> {item.actionRecommendation}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                      <span className="text-slate-500 font-mono-num whitespace-nowrap text-[11px]">
                        {item.timestamp}
                      </span>

                      {item.status !== 'resolved' && (
                        <div className="flex items-center gap-1.5">
                          {item.status === 'open' && (
                            <button
                              onClick={() => handleAcknowledge(item.alertId)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                              Tiếp nhận
                            </button>
                          )}
                          <button
                            onClick={() => handleResolve(item.alertId)}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded-lg bg-[#006E2D] text-white font-semibold hover:bg-[#005320] transition cursor-pointer disabled:opacity-50"
                          >
                            Xử lý xong
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-[#F8F9FF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                Hiển thị trang <strong className="font-mono-num text-[#0B1C30]">{page}</strong> /{' '}
                <strong className="font-mono-num text-[#0B1C30]">{totalPages}</strong> (Tổng{' '}
                <strong className="font-mono-num text-[#0B1C30]">{totalAlerts}</strong> cảnh báo)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoadingAlerts}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoadingAlerts}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {visibleFeedingLogs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Chưa có lịch sử cho ăn hoặc chặn an toàn nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {visibleFeedingLogs.map((log) => {
                const isBlocked = log.type === 'alert';
                const pondLabel = log.pondCode
                  ? log.pondName
                    ? `${log.pondCode} • ${log.pondName}`
                    : log.pondCode
                  : log.pondId;
                return (
                  <div
                    key={log.id}
                    className={`p-4 flex items-start justify-between gap-4 transition ${
                      isBlocked ? 'bg-[#FFF8F5] hover:bg-[#FFDBCA]/30' : 'hover:bg-[#F8F9FF]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isBlocked ? (
                        <ShieldAlert className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#006E2D] mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${isBlocked ? 'text-[#9D4300]' : 'text-[#0B1C30]'}`}>
                            {log.title}
                          </span>
                          {pondLabel && (
                            <span className="px-2 py-0.5 rounded-full bg-[#EFF4FF] text-[#006398] font-mono-num font-bold text-[11px]">
                              {pondLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed">{log.message}</p>
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono-num whitespace-nowrap">{log.timestamp}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
