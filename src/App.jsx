import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleRoute } from './components/common/RoleRoute';
import { UnauthorizedView } from './components/common/UnauthorizedView';
import AdminLayout from './components/admin/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { FeederControlView } from './components/FeederControlView';
import { PondsManagementView } from './components/PondsManagementView';
import { FarmersManagementView } from './components/FarmersManagementView';
import { CameraFisView } from './components/CameraFisView';
import { ScadaLogsView } from './components/ScadaLogsView';
import { IoTStationView } from './components/IoTStationView';
import { EStopModal } from './components/EStopModal';
import { Toast } from './components/Toast';
import { AlertTriangle, X } from 'lucide-react';
import { farmService } from './services/farmService';
import { pondService } from './services/pondService';
import { telemetryService } from './services/telemetryService';
import { cropSeasonService } from './services/cropSeasonService';
import { feedingService } from './services/feedingService';
import { deviceService } from './services/deviceService';
import { safetyRuleService } from './services/safetyRuleService';
import { cameraFisService } from './services/cameraFisService';
import { alertService } from './services/alertService';
import { getErrorMessage } from './services/apiClient';

const calculateAgeDays = (stockingDate) => {
  if (!stockingDate) return null;
  const start = new Date(stockingDate);
  if (Number.isNaN(start.getTime())) return null;
  const diffMs = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const isAlertSeverity = (a) => {
  const sevNum = Number(a?.severity);
  if (!Number.isNaN(sevNum) && sevNum >= 2) return true;
  const sevStr = String(a?.severity || '').toLowerCase();
  if (sevStr === 'critical' || sevStr === 'warning') return true;
  const typeStr = String(a?.type || '').toUpperCase();
  return typeStr.startsWith('CRITICAL') || typeStr.startsWith('WARNING') || typeStr.includes('OFFLINE');
};

const formatLogTimestamp = (iso) => {
  if (!iso) return '--:--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const SCADAAppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();

  const getTabFromPath = (pathname) => {
    switch (pathname) {
      case '/ponds':
        return 'ponds';
      case '/farmers':
        return 'farmers';
      case '/feeder':
        return 'feeder';
      case '/schedule':
        return 'schedule';
      case '/camera-fis':
      case '/acoustics':
        return 'camera-fis';
      case '/iot':
        return 'iot';
      case '/logs':
        return 'logs';
      case '/':
      case '/overview':
      default:
        return 'overview';
    }
  };

  const currentTab = getTabFromPath(location.pathname);

  // Dữ liệu thực tế từ Backend Database
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('all');
  const [allPonds, setAllPonds] = useState([]);
  const [selectedPondId, setSelectedPondId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [safetyRules, setSafetyRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');

  // Trạng thái dừng khẩn cấp E-Stop
  const [isEStopActive, setIsEStopActive] = useState(false);

  // Thông báo Toast
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');

  // Đồng hồ hệ thống
  const [currentTime, setCurrentTime] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      setCurrentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  }, []);

  // Tải toàn bộ dữ liệu thực tế từ Backend theo tài khoản và đúng quyền RBAC hiện tại
  const fetchAllRealData = useCallback(async (silent = false) => {
    if (!user) return { ok: true };
    if (!silent) setIsLoadingData(true);
    setDataError('');

    try {
      const canReadDevices = role === 'admin' || role === 'manager';
      const canReadSafetyRules = role === 'admin';

      const [farmsRes, devicesRes, rulesRes, alertsRes] = await Promise.allSettled([
        farmService.getFarms(1, 50),
        canReadDevices ? deviceService.getDevices() : Promise.resolve([]),
        canReadSafetyRules ? safetyRuleService.getSafetyRules() : Promise.resolve([]),
        alertService.getAlerts({ limit: 100 }),
      ]);

      const syncErrors = [];
      if (farmsRes.status === 'rejected') {
        syncErrors.push(`Trang trại: ${getErrorMessage(farmsRes.reason, 'Không thể tải danh sách trang trại')}`);
      }
      if (devicesRes.status === 'rejected') {
        syncErrors.push(`Thiết bị: ${getErrorMessage(devicesRes.reason, 'Không thể tải danh sách thiết bị')}`);
      }
      if (rulesRes.status === 'rejected') {
        syncErrors.push(`Quy tắc an toàn: ${getErrorMessage(rulesRes.reason, 'Không thể tải quy tắc an toàn')}`);
      }
      if (alertsRes.status === 'rejected') {
        syncErrors.push(`Cảnh báo: ${getErrorMessage(alertsRes.reason, 'Không thể tải cảnh báo')}`);
      }

      const farmPayload = farmsRes.status === 'fulfilled' ? farmsRes.value : { data: [] };
      const devicePayload = devicesRes.status === 'fulfilled' ? devicesRes.value : [];
      const rulePayload = rulesRes.status === 'fulfilled' ? rulesRes.value : [];
      const alertPayload = alertsRes.status === 'fulfilled' ? alertsRes.value : { data: [] };

      const farmList = Array.isArray(farmPayload) ? farmPayload : (farmPayload?.data || []);
      const deviceList = Array.isArray(devicePayload) ? devicePayload : (devicePayload?.data || []);
      const ruleList = Array.isArray(rulePayload) ? rulePayload : (rulePayload?.data || []);
      const alertList = Array.isArray(alertPayload) ? alertPayload : (alertPayload?.data || []);

      setFarms(farmList);
      setDevices(deviceList);
      setSafetyRules(ruleList);

      // Chuyển đổi cảnh báo thực tế sang danh sách nhật ký vận hành (chuẩn severity số 1|2|3 và chuỗi)
      const mappedAlertLogs = alertList.map((a) => ({
        id: `alert-${a.id}`,
        type: isAlertSeverity(a) ? 'alert' : 'info',
        title: `${a.type?.toUpperCase() || 'CẢNH BÁO'}${a.pond?.code ? ` • ${a.pond.code}` : ''}`,
        message: a.message,
        timestamp: formatLogTimestamp(a.createdAt || a.triggeredAt),
        rawTime: new Date(a.createdAt || a.triggeredAt || 0).getTime() || 0,
        pondId: a.pondId,
        pondCode: a.pond?.code || null,
        status: a.status,
      }));
      setLogs(mappedAlertLogs);

      if (farmList.length === 0) {
        setAllPonds([]);
        setSelectedPondId(null);
        if (syncErrors.length > 0) {
          const msg = syncErrors[0];
          setDataError(msg);
          return { ok: false, error: msg };
        }
        return { ok: true };
      }

      // Lấy danh sách ao nuôi của từng trang trại
      const pondsPerFarm = await Promise.all(
        farmList.map(async (farm) => {
          try {
            const res = await pondService.getPondsByFarm(farm.id, 1, 100);
            const list = Array.isArray(res) ? res : (res?.data || []);
            return list.map((p) => ({
              ...p,
              farmId: farm.id,
              farmName: farm.name,
              farmAddress: farm.address,
            }));
          } catch (err) {
            syncErrors.push(`Ao nuôi (${farm.name}): ${getErrorMessage(err, 'Không thể tải danh sách ao')}`);
            return [];
          }
        })
      );

      const rawPonds = pondsPerFarm.flat();

      // Lấy dữ liệu vận hành thực tế (Telemetry, Vụ nuôi, Lịch ăn, Nhật ký cho ăn, Camera FIS) cho từng ao
      const enrichedPonds = await Promise.all(
        rawPonds.map(async (pond) => {
          const [teleRes, seasonsRes, schedulesRes, recordsRes, fisRes] = await Promise.allSettled([
            telemetryService.getLatestTelemetry(pond.id),
            cropSeasonService.getSeasonsByPond(pond.id),
            feedingService.getSchedules(pond.id),
            feedingService.getRecords(pond.id),
            cameraFisService.getLatestFis(pond.id),
          ]);

          const telemetry = teleRes.status === 'fulfilled' ? teleRes.value : null;
          const seasonsVal = seasonsRes.status === 'fulfilled' ? seasonsRes.value : [];
          const schedulesVal = schedulesRes.status === 'fulfilled' ? schedulesRes.value : [];
          const recordsVal = recordsRes.status === 'fulfilled' ? recordsRes.value : [];
          const fisVal = fisRes.status === 'fulfilled' ? fisRes.value : null;

          const hasTelemetry = Boolean(telemetry && telemetry.id);
          const seasons = Array.isArray(seasonsVal) ? seasonsVal : (seasonsVal?.data || []);
          const activeSeason = seasons.find((s) => s.status === 'active') || seasons[0] || null;

          const schedules = Array.isArray(schedulesVal) ? schedulesVal : (schedulesVal?.data || []);
          const records = Array.isArray(recordsVal) ? recordsVal : (recordsVal?.data || []);

          const pondDevices = deviceList.filter((d) => d.pondId === pond.id);
          const feederDevice = pondDevices.find((d) => d.type === 'feeder') || null;
          const sensorDevice = pondDevices.find((d) => d.type === 'sensor_node') || null;
          const cameraDevice = pondDevices.find((d) => d.type === 'camera') || null;

          const enabledSchedules = schedules.filter((s) => s.isEnabled !== false);
          const targetKg = parseFloat(
            enabledSchedules.reduce((sum, s) => sum + Number(s.feedAmountKg || 0), 0).toFixed(1)
          );

          // Tính tổng lượng cám đã rải từ các bản ghi cho ăn thực tế
          const sprayedKg = parseFloat(
            records
              .filter((r) => r.status === 'completed' || r.status === 'running')
              .reduce((sum, r) => sum + Number(r.actualAmountKg ?? r.requestedAmountKg ?? 0), 0)
              .toFixed(1)
          );

          const hopperKg =
            feederDevice?.metadata?.hopperKg !== undefined
              ? Number(feederDevice.metadata.hopperKg)
              : null;
          const maxHopperKg =
            feederDevice?.metadata?.maxHopperKg !== undefined
              ? Number(feederDevice.metadata.maxHopperKg)
              : 70;
          const vfdFrequencyHz =
            feederDevice?.metadata?.vfdFrequencyHz !== undefined
              ? Number(feederDevice.metadata.vfdFrequencyHz)
              : null;

          const nextSchedule = enabledSchedules[0] || null;
          const currentMeal = nextSchedule
            ? `${nextSchedule.name} (${String(nextSchedule.timeOfDay).slice(0, 5)})`
            : 'Chưa thiết lập lịch';

          const fisLevel = fisVal?.hasData ? fisVal.status?.appetiteLevel : null;
          const fisScore = fisVal?.hasData ? Number(fisVal.status?.fisScore) : null;
          const fisLabel = fisVal?.hasData
            ? fisVal.status?.appetiteLevelDescription || `Mức ${fisLevel}`
            : 'Chưa có dữ liệu';

          // Xác định trạng thái vận hành thực tế của ao
          let operationalStatus = pond.status || 'active';
          if (hopperKg !== null && hopperKg < 5) {
            operationalStatus = 'empty_hopper';
          }

          return {
            ...pond,
            id: pond.id,
            code: pond.code,
            name: pond.name,
            farmId: pond.farmId,
            farmName: pond.farmName,
            areaM2: Number(pond.areaM2 || 0),
            area: `${Number(pond.areaM2 || 0).toLocaleString('vi-VN')} m²`,
            status: operationalStatus,
            dbStatus: pond.status || 'active',
            shrimpType: activeSeason?.name || 'Chưa khai báo vụ nuôi',
            stockingCount: activeSeason?.initialCount
              ? `${Number(activeSeason.initialCount).toLocaleString('vi-VN')} con`
              : 'Chưa thả giống',
            ageDays: calculateAgeDays(activeSeason?.stockingDate),
            activeSeason,
            hasTelemetry,
            telemetryMeasuredAt: hasTelemetry ? telemetry.measuredAt : null,
            do: hasTelemetry && telemetry.dissolvedOxygenMgL !== null ? Number(telemetry.dissolvedOxygenMgL) : null,
            ph: hasTelemetry && telemetry.ph !== null ? Number(telemetry.ph) : null,
            temp: hasTelemetry && telemetry.temperatureC !== null ? Number(telemetry.temperatureC) : null,
            salinity: hasTelemetry && telemetry.salinityPpt !== null ? Number(telemetry.salinityPpt) : null,
            nh3: hasTelemetry && telemetry.ammoniaMgL !== null ? Number(telemetry.ammoniaMgL) : null,
            turbidity: hasTelemetry && telemetry.turbidityNtu !== null ? Number(telemetry.turbidityNtu) : null,
            fisLevel,
            fisScore,
            fisLabel,
            currentMeal,
            sprayedKg,
            targetKg,
            hopperKg,
            maxHopperKg,
            vfdFrequencyHz,
            schedules,
            records,
            devices: pondDevices,
            feederDevice,
            sensorDevice,
            cameraDevice,
            deviceId: feederDevice?.id || null,
          };
        })
      );

      // Gộp thêm lịch sử cho ăn thực tế & Safety Rule Engine của từng ao vào Nhật ký vận hành
      const feedingLogs = enrichedPonds.flatMap((pond) =>
        (pond.records || []).slice(0, 20).map((r) => {
          const isBlocked = r.status === 'blocked_by_safety';
          const amount = r.actualAmountKg ?? r.requestedAmountKg ?? 0;
          const timeVal = r.createdAt || r.startedAt || r.updatedAt;
          return {
            id: `feed-${r.id}`,
            type: isBlocked ? 'alert' : 'info',
            title: isBlocked
              ? `CHẶN CHO ĂN AN TOÀN • ${pond.code}`
              : `CHO ĂN ${String(r.source || 'MANUAL').toUpperCase()} • ${pond.code}`,
            message: isBlocked
              ? r.blockedReason || `Safety Engine chặn lệnh xả ${amount} kg.`
              : `Trạng thái: ${r.status || 'completed'} • Khối lượng: ${amount} kg.`,
            timestamp: formatLogTimestamp(timeVal),
            rawTime: new Date(timeVal || 0).getTime() || 0,
            pondId: pond.id,
            pondCode: pond.code,
            status: r.status,
          };
        })
      );

      const mergedLogs = [...mappedAlertLogs, ...feedingLogs].sort((a, b) => b.rawTime - a.rawTime);
      setLogs(mergedLogs);

      setAllPonds(enrichedPonds);
      setSelectedPondId((prev) => {
        if (prev && enrichedPonds.some((p) => p.id === prev)) return prev;
        return enrichedPonds[0]?.id || null;
      });

      if (syncErrors.length > 0) {
        const msg = syncErrors[0];
        setDataError(msg);
        return { ok: false, error: msg };
      }
      return { ok: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể đồng bộ dữ liệu từ máy chủ Backend.');
      setDataError(msg);
      return { ok: false, error: msg };
    } finally {
      if (!silent) setIsLoadingData(false);
    }
  }, [user, role]);

  useEffect(() => {
    fetchAllRealData(false);
    const pollTimer = setInterval(() => {
      fetchAllRealData(true);
    }, 20000);
    return () => clearInterval(pollTimer);
  }, [fetchAllRealData]);

  // Lọc danh sách ao, thiết bị và nhật ký vận hành theo đúng trang trại đang chọn trên Header
  const filteredPonds =
    selectedFarmId === 'all'
      ? allPonds
      : allPonds.filter((p) => p.farmId === selectedFarmId);

  const filteredPondIds = new Set(filteredPonds.map((p) => p.id));

  const filteredDevices =
    selectedFarmId === 'all'
      ? devices
      : devices.filter((d) => d.pondId && filteredPondIds.has(d.pondId));

  const filteredLogs =
    selectedFarmId === 'all'
      ? logs
      : logs.filter((l) => l.pondId && filteredPondIds.has(l.pondId));

  const activePond =
    selectedFarmId === 'all'
      ? allPonds.find((p) => p.id === selectedPondId) || allPonds[0] || null
      : filteredPonds.find((p) => p.id === selectedPondId) || filteredPonds[0] || null;

  // Kích hoạt Dừng khẩn cấp (E-STOP)
  const handleEmergencyStop = async () => {
    setIsEStopActive(true);
    try {
      if (activePond?.deviceId) {
        await deviceService.emergencyStop(activePond.deviceId);
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Không thể gửi lệnh dừng khẩn cấp lên máy chủ Backend!'), 'alert');
    }
    const newLog = {
      id: Date.now().toString(),
      timestamp: currentTime,
      title: 'DỪNG KHẨN CẤP TOÀN TRẠM',
      message: 'Người vận hành đã kích hoạt ngắt bảo vệ khẩn cấp hệ thống máy cho ăn.',
      type: 'alert',
    };
    setLogs((prev) => [newLog, ...prev]);
    await fetchAllRealData(true);
  };

  const handleResetEStop = async () => {
    setIsEStopActive(false);
    await fetchAllRealData(true);
    showToast('Hệ thống đã được khôi phục trạng thái vận hành an toàn.', 'success');
  };

  // Nút Đồng bộ thực tế từ Backend
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const result = await fetchAllRealData(true);
    setIsSyncing(false);
    if (result?.ok) {
      showToast(
        `Đã đồng bộ dữ liệu thực tế: ${farms.length} trang trại, ${allPonds.length} ao nuôi.`,
        'success'
      );
    }
  };

  // Nạp thêm cám vào phễu của thiết bị Feeder thực tế
  const handleRefillFeed = async (pondId, kg) => {
    const targetPond = allPonds.find((p) => p.id === pondId);
    if (!targetPond) return;

    if (!targetPond.feederDevice) {
      showToast(
        `Ao ${targetPond.code} chưa được gán thiết bị máy cho ăn. Vui lòng gán thiết bị tại mục Trang trại & Ao nuôi.`,
        'alert'
      );
      return;
    }

    const currentHopper = Number(targetPond.hopperKg ?? 0);
    const maxHopper = Number(targetPond.maxHopperKg ?? 70);
    const nextHopper = Math.min(maxHopper, parseFloat((currentHopper + kg).toFixed(1)));

    try {
      await deviceService.updateDevice(targetPond.feederDevice.id, {
        metadata: {
          ...(targetPond.feederDevice.metadata || {}),
          hopperKg: nextHopper,
          maxHopperKg: maxHopper,
        },
      });
      await fetchAllRealData(true);
      showToast(`Đã cập nhật lượng cám trong phễu ${targetPond.code}: ${nextHopper} / ${maxHopper} kg.`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Không thể cập nhật số liệu phễu chứa lên máy chủ.'), 'alert');
    }
  };

  // Tạm dừng / tiếp tục ao nuôi
  const handleTogglePondPause = async (pondId) => {
    const target = allPonds.find((p) => p.id === pondId);
    if (!target) return;
    const nextStatus = target.dbStatus === 'maintenance' ? 'active' : 'maintenance';
    try {
      await pondService.updatePond(target.farmId, target.id, { status: nextStatus });
      await fetchAllRealData(true);
      showToast(
        `${target.code}: Đã chuyển sang trạng thái ${nextStatus === 'active' ? 'Đang hoạt động' : 'Tạm dừng / bảo dưỡng'}.`,
        'info'
      );
    } catch (err) {
      showToast(getErrorMessage(err, 'Không thể cập nhật trạng thái ao nuôi.'), 'alert');
    }
  };

  // Rải thử nghiệm 10s
  const handleRunTestFeeder = async (pondId) => {
    const target = allPonds.find((p) => p.id === pondId);
    if (!target) return;
    if (!target.feederDevice) {
      showToast(`Ao ${target.code} chưa được gán máy cho ăn để chạy thử.`, 'alert');
      return;
    }
    try {
      await feedingService.createRecord(target.id, {
        deviceId: target.feederDevice.id,
        requestedAmountKg: 0.5,
        source: 'manual',
      });
      await fetchAllRealData(true);
      showToast(`[${target.code}]: Đã gửi lệnh chạy thử mâm phun (0.5 kg) xuống máy cho ăn.`, 'success');
    } catch (err) {
      showToast(
        `[${target.code}]: ${getErrorMessage(err, 'Không thể kích hoạt lệnh chạy thử (kiểm tra quy tắc an toàn hoặc thiết bị).')}`,
        'alert'
      );
    }
  };

  const handleMuteAlarm = (pondId) => {
    const target = allPonds.find((p) => p.id === pondId);
    showToast(
      `Đã tắt còi cảnh báo tại ${target?.code || 'ao nuôi'}. Vui lòng kiểm tra và nạp thêm cám vào phễu.`,
      'info'
    );
  };

  const handleNavigateTab = (tab, pondId) => {
    if (pondId !== undefined && pondId !== null) {
      setSelectedPondId(pondId);
    }
    const targetPath = tab === 'overview' ? '/' : `/${tab}`;
    navigate(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col font-sans text-[#0B1C30] selection:bg-[#EA580C] selection:text-white">
      {/* 1. Header điều hướng */}
      <Header
        currentTime={currentTime}
        onEmergencyStop={handleEmergencyStop}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        farms={farms}
        selectedFarmId={selectedFarmId}
        onSelectFarm={(fId) => setSelectedFarmId(fId)}
        ponds={filteredPonds}
        activePond={activePond}
        onSelectPond={(pId) => setSelectedPondId(pId)}
      />

      {/* 2. Khung nội dung chính */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleNavigateTab(tab)}
          activePondCount={filteredPonds.length}
          feederReadyCount={filteredDevices.filter((d) => d.type === 'feeder' && d.status === 'online').length}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden">
          {dataError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{dataError}</span>
              </div>
              <button
                onClick={() => setDataError('')}
                className="text-red-500 hover:text-red-800 cursor-pointer shrink-0"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  farms={farms}
                  selectedFarmId={selectedFarmId}
                  ponds={filteredPonds}
                  logs={filteredLogs}
                  isLoading={isLoadingData}
                  onNavigateTab={handleNavigateTab}
                  onRefillFeed={handleRefillFeed}
                  onTogglePondPause={handleTogglePondPause}
                  onRunTestFeeder={handleRunTestFeeder}
                  onMuteAlarm={handleMuteAlarm}
                  onShowToast={showToast}
                />
              }
            />
            <Route
              path="/overview"
              element={
                <DashboardView
                  farms={farms}
                  selectedFarmId={selectedFarmId}
                  ponds={filteredPonds}
                  logs={filteredLogs}
                  isLoading={isLoadingData}
                  onNavigateTab={handleNavigateTab}
                  onRefillFeed={handleRefillFeed}
                  onTogglePondPause={handleTogglePondPause}
                  onRunTestFeeder={handleRunTestFeeder}
                  onMuteAlarm={handleMuteAlarm}
                  onShowToast={showToast}
                />
              }
            />
            <Route
              path="/ponds"
              element={
                <PondsManagementView
                  ponds={allPonds}
                  onSelectPond={(id) => setSelectedPondId(id)}
                  onNavigateTab={handleNavigateTab}
                  onRefillFeed={handleRefillFeed}
                  onRefreshGlobalData={() => fetchAllRealData(true)}
                />
              }
            />
            <Route
              path="/farmers"
              element={
                <RoleRoute allowedRoles={['manager', 'admin']}>
                  <FarmersManagementView />
                </RoleRoute>
              }
            />
            <Route
              path="/feeder"
              element={
                <FeederControlView
                  ponds={filteredPonds}
                  selectedPond={activePond}
                  onSelectPond={(id) => setSelectedPondId(id)}
                  onNavigateTab={handleNavigateTab}
                  onEmergencyStop={handleEmergencyStop}
                  onShowToast={showToast}
                  onRefreshData={() => fetchAllRealData(true)}
                  currentTime={currentTime}
                />
              }
            />
            <Route
              path="/schedule"
              element={
                <ScheduleView
                  ponds={filteredPonds}
                  selectedPond={activePond}
                  onSelectPond={(id) => setSelectedPondId(id)}
                  safetyRules={safetyRules}
                  onRefreshData={() => fetchAllRealData(true)}
                  onShowToast={showToast}
                />
              }
            />
            <Route
              path="/camera-fis"
              element={
                <CameraFisView
                  ponds={filteredPonds}
                  selectedPond={activePond}
                  onSelectPond={(id) => setSelectedPondId(id)}
                  onNavigateTab={handleNavigateTab}
                />
              }
            />
            <Route
              path="/acoustics"
              element={
                <CameraFisView
                  ponds={filteredPonds}
                  selectedPond={activePond}
                  onSelectPond={(id) => setSelectedPondId(id)}
                  onNavigateTab={handleNavigateTab}
                />
              }
            />
            <Route
              path="/logs"
              element={
                <ScadaLogsView
                  logs={filteredLogs}
                  onExport={() => {
                    const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                    const csvContent = [
                      'Thời gian,Mã ao,Sự kiện,Nội dung,Loại',
                      ...filteredLogs.map((l) =>
                        [
                          escapeCsv(l.timestamp),
                          escapeCsv(l.pondCode || 'TRẠM'),
                          escapeCsv(l.title),
                          escapeCsv(l.message),
                          escapeCsv(l.type),
                        ].join(',')
                      ),
                    ].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `shrimpmate_nhat_ky_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast('Đã xuất toàn bộ nhật ký vận hành ra tệp CSV.', 'success');
                  }}
                />
              }
            />
            <Route
              path="/iot"
              element={
                <IoTStationView
                  devices={filteredDevices}
                  ponds={filteredPonds}
                  onRefreshData={() => fetchAllRealData(true)}
                  onNavigateTab={handleNavigateTab}
                />
              }
            />
            <Route
              path="*"
              element={
                <DashboardView
                  farms={farms}
                  selectedFarmId={selectedFarmId}
                  ponds={filteredPonds}
                  logs={filteredLogs}
                  isLoading={isLoadingData}
                  onNavigateTab={handleNavigateTab}
                  onRefillFeed={handleRefillFeed}
                  onTogglePondPause={handleTogglePondPause}
                  onRunTestFeeder={handleRunTestFeeder}
                  onMuteAlarm={handleMuteAlarm}
                  onShowToast={showToast}
                />
              }
            />
          </Routes>
        </main>
      </div>

      {/* E-Stop Modal */}
      <EStopModal
        isOpen={isEStopActive}
        onReset={handleResetEStop}
        activeDeviceId={activePond?.deviceId || activePond?.id}
      />

      {/* Floating System Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedView />} />

          {/* Root Admin Platform Dashboard */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Protected Application Zone */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SCADAAppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
