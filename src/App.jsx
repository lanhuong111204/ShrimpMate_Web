import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  INITIAL_PONDS, 
  INITIAL_SCHEDULE, 
  INITIAL_SAFETY_RULES, 
  INITIAL_LOGS 
} from './data/mockData';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { UnauthorizedView } from './components/common/UnauthorizedView';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { FeederControlView } from './components/FeederControlView';
import { PondsManagementView } from './components/PondsManagementView';
import { BioAcousticsView } from './components/BioAcousticsView';
import { ScadaLogsView } from './components/ScadaLogsView';
import { IoTStationView } from './components/IoTStationView';
import { EStopModal } from './components/EStopModal';
import { Toast } from './components/Toast';

const SCADAAppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Map route pathname to SCADA Tab
  const getTabFromPath = (pathname) => {
    switch (pathname) {
      case '/ponds':
        return 'ponds';
      case '/feeder':
        return 'feeder';
      case '/schedule':
        return 'schedule';
      case '/acoustics':
        return 'acoustics';
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
  const [selectedPondId, setSelectedPondId] = useState(2);

  // SCADA State
  const [ponds, setPonds] = useState(INITIAL_PONDS);
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [safetyRules, setSafetyRules] = useState(INITIAL_SAFETY_RULES);
  const [logs, setLogs] = useState(INITIAL_LOGS);

  // Safety & E-stop Modal
  const [isEStopActive, setIsEStopActive] = useState(false);

  // Toast System
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');

  // Real-time Clock & Sync simulation
  const [currentTime, setCurrentTime] = useState('10:48:22');
  const [isSyncing, setIsSyncing] = useState(false);

  // Live Clock Tick
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

  // Periodic DO and Sensor Jitter Simulation (Living SCADA environment)
  useEffect(() => {
    const interval = setInterval(() => {
      setPonds((prev) =>
        prev.map((p) => {
          if (p.status === 'empty_hopper') return p;
          const doDelta = (Math.random() - 0.5) * 0.04;
          const tempDelta = (Math.random() - 0.5) * 0.05;
          return {
            ...p,
            do: parseFloat(Math.max(4.0, Math.min(7.5, p.do + doDelta)).toFixed(2)),
            temp: parseFloat(Math.max(27.0, Math.min(32.5, p.temp + tempDelta)).toFixed(1)),
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  };

  // E-STOP Trigger
  const handleEmergencyStop = () => {
    setIsEStopActive(true);
    // Pause or alert all ponds
    setPonds((prev) =>
      prev.map((p) => ({
        ...p,
        motorStatus: 'E-STOP Ngắt điện khẩn cấp',
      }))
    );
    const newLog = {
      id: Date.now().toString(),
      timestamp: currentTime,
      title: 'E-STOP KHẨN CẤP ĐÃ ĐƯỢC ẤN',
      message: 'Kỹ sư kích hoạt ngắt bảo vệ rơ-le toàn bộ hệ thống máy rải cám.',
      type: 'alert',
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // E-STOP Recovery
  const handleResetEStop = () => {
    setIsEStopActive(false);
    setPonds((prev) =>
      prev.map((p) => ({
        ...p,
        motorStatus: p.status === 'empty_hopper' ? 'Ngắt tự vệ tránh cháy' : 'Sẵn sàng / Chờ xung',
      }))
    );
    showToast('Hệ thống SCADA đã được khôi phục an toàn.', 'success');
  };

  // Telemetry Sync Action
  const handleManualSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showToast('Đang quét và đồng bộ gói tin LoRaWAN từ 4 trạm bờ ao...', 'info');
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Đồng bộ hoàn tất: 4/4 trạm phản hồi (độ trễ 18ms).', 'success');
    }, 800);
  };

  // Refill Hopper Action (e.g. Add 25kg)
  const handleRefillFeed = (pondId, kg) => {
    setPonds((prev) =>
      prev.map((p) => {
        if (p.id === pondId) {
          const newHopper = parseFloat((p.hopperKg + kg).toFixed(1));
          const wasAlert = p.status === 'empty_hopper';
          return {
            ...p,
            hopperKg: newHopper,
            status: wasAlert ? 'spraying' : p.status,
            motorStatus: wasAlert ? 'Đang cấp cám bình thường' : p.motorStatus,
          };
        }
        return p;
      })
    );
    showToast(`Đã nạp thêm +${kg}kg cám vào phễu Ao 0${pondId}.`, 'success');
  };

  // Toggle Pond Pause/Play
  const handleTogglePondPause = (pondId) => {
    setPonds((prev) =>
      prev.map((p) => {
        if (p.id === pondId) {
          const nextStatus = p.status === 'paused' ? 'spraying' : 'paused';
          return {
            ...p,
            status: nextStatus,
          };
        }
        return p;
      })
    );
    const target = ponds.find((p) => p.id === pondId);
    showToast(
      `Ao 0${pondId}: ${target?.status === 'paused' ? 'Tiếp tục phun cám' : 'Tạm dừng thăm nhá 10 phút'}.`,
      'info'
    );
  };

  // Test feeder single pond 10s
  const handleRunTestFeeder = (pondId) => {
    showToast(`[AO 0${pondId}]: Kích hoạt thử nghiệm mâm phun 10 giây.`, 'info');
  };

  // Mute Alarm for pond
  const handleMuteAlarm = (pondId) => {
    showToast(`Đã tắt còi cảnh báo tại bờ Ao 0${pondId}. Vui lòng nạp cám vào phễu để tiếp tục.`, 'info');
  };

  // Navigate to specific tab with optional pond selection
  const handleNavigateTab = (tab, pondId) => {
    if (pondId !== undefined) {
      setSelectedPondId(pondId);
    }
    const targetPath = tab === 'overview' ? '/' : `/${tab}`;
    navigate(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find active pond object for Feeder view
  const activePond = ponds.find((p) => p.id === selectedPondId) || ponds[1] || ponds[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* 1. Industrial Top Header */}
      <Header
        currentTime={currentTime}
        onEmergencyStop={handleEmergencyStop}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        activePondCode={activePond.code}
      />

      {/* 2. Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleNavigateTab(tab)}
          activePondCount={ponds.length}
          feederReadyCount={ponds.filter((p) => p.status !== 'empty_hopper').length}
        />

        {/* Dynamic View Viewport */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  ponds={ponds}
                  logs={logs}
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
                  ponds={ponds}
                  logs={logs}
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
                  ponds={ponds}
                  onSelectPond={(id) => setSelectedPondId(id)}
                  onNavigateTab={handleNavigateTab}
                  onRefillFeed={handleRefillFeed}
                />
              }
            />
            <Route
              path="/feeder"
              element={
                <FeederControlView
                  selectedPond={activePond}
                  onEmergencyStop={handleEmergencyStop}
                  onShowToast={showToast}
                  currentTime={currentTime}
                />
              }
            />
            <Route
              path="/schedule"
              element={
                <ScheduleView
                  schedule={schedule}
                  safetyRules={safetyRules}
                  onUpdateSchedule={setSchedule}
                  onUpdateSafetyRules={setSafetyRules}
                  onShowToast={showToast}
                  pondCode={activePond.name}
                  pondArea={activePond.area}
                />
              }
            />
            <Route path="/acoustics" element={<BioAcousticsView />} />
            <Route
              path="/logs"
              element={
                <ScadaLogsView
                  logs={logs}
                  onExport={() => {
                    showToast('Đã xuất toàn bộ nhật ký SCADA ra tệp CSV.', 'success');
                  }}
                />
              }
            />
            <Route path="/iot" element={<IoTStationView />} />
            <Route
              path="*"
              element={
                <DashboardView
                  ponds={ponds}
                  logs={logs}
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
      <EStopModal isOpen={isEStopActive} onReset={handleResetEStop} />

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

          {/* Protected SCADA Application Zone */}
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
