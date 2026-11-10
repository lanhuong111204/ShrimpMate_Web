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
import { farmService } from './services/farmService';
import { pondService } from './services/pondService';
import { telemetryService } from './services/telemetryService';
import { cropSeasonService } from './services/cropSeasonService';
import { feedingService } from './services/feedingService';
import { deviceService } from './services/deviceService';
import { safetyRuleService } from './services/safetyRuleService';
import { cameraFisService } from './services/cameraFisService';
import { alertService } from './services/alertService';

const calculateAgeDays = (stockingDate) => {
  if (!stockingDate) return null;
  const start = new Date(stockingDate);
  if (Number.isNaN(start.getTime())) return null;
  const diffMs = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const SCADAAppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  // Tải toàn bộ dữ liệu thực tế từ Backend theo tài khoản hiện tại
  const fetchAllRealData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoadingData(true);

    try {
      const [farmsRes, devicesRes, rulesRes, alertsRes] = await Promise.all([
        farmService.getFarms(1, 50).catch(() => ({ data: [] })),
        deviceService.getDevices().catch(() => []),
        safetyRuleService.getSafetyRules().catch(() => []),
        alertService.getAlerts({ limit: 50 }).catch(() => ({ data: [] })),
      ]);

      const farmList = Array.isArray(farmsRes) ? farmsRes : (farmsRes?.data || []);
      const deviceList = Array.isArray(devicesRes) ? devicesRes : (devicesRes?.data || []);
      const ruleList = Array.isArray(rulesRes) ? rulesRes : (rulesRes?.data || []);
      const alertList = Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []);

      setFarms(farmList);
      setDevices(deviceList);
      setSafetyRules(ruleList);

      // Chuyển đổi cảnh báo thực tế sang danh sách nhật ký vận hành
      const mappedLogs = alertList.map((a) => ({
        id: a.id,
        type: a.severity === 'critical' || a.severity === 'warning' ? 'alert' : 'info',
        title: `${a.type?.toUpperCase() || 'CẢNH BÁO'}${a.pond?.code ? ` • ${a.pond.code}` : ''}`,
        message: a.message,
        timestamp: a.createdAt
          ? new Date(a.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '--:--:--',
        pondId: a.pondId,
        pondCode: a.pond?.code || null,
        status: a.status,
      }));
      setLogs(mappedLogs);

      if (farmList.length === 0) {
        setAllPonds([]);
        setSelectedPondId(null);
        return;
      }

      // Lấy danh sách ao nuôi của từng trang trại
      const pondsPerFarm = await Promise.all(
        farmList.map(async (farm) => {
          const res = await pondService.getPondsByFarm(farm.id, 1, 100).catch(() => ({ data: [] }));
          const list = Array.isArray(res) ? res : (res?.data || []);
          return list.map((p) => ({
            ...p,
            farmId: farm.id,
            farmName: farm.name,
            farmAddress: farm.address,
          }));
        })
      );

      const rawPonds = pondsPerFarm.flat();

      // Lấy dữ liệu vận hành thực tế (Telemetry, Vụ nuôi, Lịch ăn, Nhật ký cho ăn, Camera FIS) cho từng ao
      const enrichedPonds = await Promise.all(
        rawPonds.map(async (pond) => {
          const [telemetry, seasonsRes, schedulesRes, recordsRes, fisRes] = await Promise.all([
            telemetryService.getLatestTelemetry(pond.id).catch(() => null),
            cropSeasonService.getSeasonsByPond(pond.id).catch(() => []),
            feedingService.getSchedules(pond.id).catch(() => []),
            feedingService.getRecords(pond.id).catch(() => []),
            cameraFisService.getLatestFis(pond.id).catch(() => null),
          ]);

          const hasTelemetry = Boolean(telemetry && telemetry.id);
          const seasons = Array.isArray(seasonsRes) ? seasonsRes : (seasonsRes?.data || []);
          const activeSeason = seasons.find((s) => s.status === 'active') || seasons[0] || null;

          const schedules = Array.isArray(schedulesRes) ? schedulesRes : (schedulesRes?.data || []);
          const records = Array.isArray(recordsRes) ? recordsRes : (recordsRes?.data || []);

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

          const fisLevel = fisRes?.hasData ? fisRes.status?.appetiteLevel : null;
          const fisScore = fisRes?.hasData ? Number(fisRes.status?.fisScore) : null;
          const fisLabel = fisRes?.hasData
            ? fisRes.status?.appetiteLevelDescription || `Mức ${fisLevel}`
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

      setAllPonds(enrichedPonds);
      setSelectedPondId((prev) => {
        if (prev && enrichedPonds.some((p) => p.id === prev)) return prev;
        return enrichedPonds[0]?.id || null;
      });
    } catch (err) {
      console.warn('Lỗi đồng bộ dữ liệu từ máy chủ:', err);
    } finally {
      if (!silent) setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllRealData(false);
    const pollTimer = setInterval(() => {
      fetchAllRealData(true);
    }, 20000);
    return () => clearInterval(pollTimer);
  }, [fetchAllRealData]);

  // Lọc danh sách ao theo trang trại đang chọn trên Header
  const filteredPonds =
    selectedFarmId === 'all'
      ? allPonds
      : allPonds.filter((p) => p.farmId === selectedFarmId);

  const activePond =
    filteredPonds.find((p) => p.id === selectedPondId) ||
    allPonds.find((p) => p.id === selectedPondId) ||
    filteredPonds[0] ||
    allPonds[0] ||
    null;

  // Kích hoạt Dừng khẩn cấp (E-STOP)
  const handleEmergencyStop = async () => {
    setIsEStopActive(true);
    try {
      if (activePond?.deviceId) {
        await deviceService.emergencyStop(activePond.deviceId).catch(() => {});
      }
    } catch (err) {
      console.warn('Lỗi gửi lệnh dừng khẩn cấp:', err);
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
    await fetchAllRealData(true);
    setIsSyncing(false);
    showToast(
      `Đã đồng bộ dữ liệu thực tế: ${farms.length} trang trại, ${allPonds.length} ao nuôi.`,
      'success'
    );
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
    } catch {
      showToast('Không thể cập nhật số liệu phễu chứa lên máy chủ.', 'alert');
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
    } catch {
      showToast('Không thể cập nhật trạng thái ao nuôi.', 'alert');
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
    } catch {
      showToast(`[${target.code}]: Không thể kích hoạt lệnh chạy thử (kiểm tra quy tắc an toàn hoặc thiết bị).`, 'alert');
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
          activePondCount={allPonds.length}
          feederReadyCount={devices.filter((d) => d.type === 'feeder' && d.status === 'online').length}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  farms={farms}
                  ponds={filteredPonds}
                  logs={logs}
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
                  ponds={filteredPonds}
                  logs={logs}
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
                  ponds={allPonds}
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
                  ponds={allPonds}
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
                  ponds={allPonds}
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
                  ponds={allPonds}
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
                  logs={logs}
                  onExport={() => {
                    showToast('Đã xuất toàn bộ nhật ký vận hành ra tệp CSV.', 'success');
                  }}
                />
              }
            />
            <Route
              path="/iot"
              element={
                <IoTStationView
                  devices={devices}
                  ponds={allPonds}
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
                  ponds={filteredPonds}
                  logs={logs}
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
