import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { alertService } from './services/alertService';
import { socketService } from './services/socketService';
import { getErrorMessage } from './services/apiClient';
import { formatLogTimestamp, mapAlertToLogItem } from './utils/alertHelpers';

const rememberSeenKey = (setRef, key) => {
  if (!key) return;
  const set = setRef.current;
  set.add(key);
  if (set.size > 300) {
    const oldest = set.values().next().value;
    if (oldest !== undefined) set.delete(oldest);
  }
};

const getLocalDateKey = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const summarizeFeedingRecords = (records = []) => {
  const todayKey = getLocalDateKey(new Date());
  const sprayedKg = parseFloat(
    records
      .filter((r) => {
        const ts = r.startedAt || r.createdAt;
        return (
          ts &&
          getLocalDateKey(ts) === todayKey &&
          (r.status === 'completed' || r.status === 'running' || r.status === 'in_progress')
        );
      })
      .reduce((sum, r) => sum + Number(r.actualAmountKg ?? r.requestedAmountKg ?? 0), 0)
      .toFixed(1)
  );

  const sorted = [...records].sort(
    (a, b) =>
      new Date(b.createdAt || b.startedAt || 0).getTime() -
      new Date(a.createdAt || a.startedAt || 0).getTime()
  );
  const latestRecord = sorted[0] || null;
  const isFeeding = Boolean(
    latestRecord &&
      (latestRecord.status === 'running' || latestRecord.status === 'in_progress')
  );

  return {
    sprayedKg,
    isFeeding,
    activeFeedingRecord: isFeeding ? latestRecord : null,
  };
};

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
  const [alertRefreshKey, setAlertRefreshKey] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');

  // Trạng thái dừng khẩn cấp E-Stop
  const [isEStopActive, setIsEStopActive] = useState(false);

  // Thông báo Toast
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');

  const [isSyncing, setIsSyncing] = useState(false);

  const allPondsRef = useRef([]);
  const pondIdSetRef = useRef(new Set());
  const roleRef = useRef(role);
  const seenAlertIdsRef = useRef(new Set());
  const seenCompletedIdsRef = useRef(new Set());
  const fetchAllRealDataRef = useRef(null);

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
      const canReadDevices = true;
      const canReadSafetyRules = role === 'admin' || role === 'farmer';

      const [farmsRes, devicesRes, rulesRes, alertsRes] = await Promise.allSettled([
        farmService.getFarms(1, 50),
        canReadDevices ? deviceService.getDevices().catch(() => []) : Promise.resolve([]),
        canReadSafetyRules ? safetyRuleService.getSafetyRules().catch(() => []) : Promise.resolve([]),
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

      // Chuyển đổi cảnh báo thực tế sang danh sách nhật ký vận hành (giữ đủ severity, device, actionRecommendation)
      const mappedAlertLogs = alertList.map(mapAlertToLogItem);
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

      // Lấy dữ liệu vận hành thực tế (Telemetry, Vụ nuôi, Lịch ăn, Nhật ký cho ăn) cho từng ao
      const enrichedPonds = await Promise.all(
        rawPonds.map(async (pond) => {
          const [teleRes, seasonsRes, schedulesRes, recordsRes] = await Promise.allSettled([
            telemetryService.getLatestTelemetry(pond.id),
            cropSeasonService.getSeasonsByPond(pond.id),
            feedingService.getSchedules(pond.id),
            feedingService.getRecords(pond.id),
          ]);

          const telemetry = teleRes.status === 'fulfilled' ? teleRes.value : null;
          const seasonsVal = seasonsRes.status === 'fulfilled' ? seasonsRes.value : [];
          const schedulesVal = schedulesRes.status === 'fulfilled' ? schedulesRes.value : [];
          const recordsVal = recordsRes.status === 'fulfilled' ? recordsRes.value : [];

          const hasTelemetry = Boolean(telemetry && telemetry.id);
          const seasons = Array.isArray(seasonsVal) ? seasonsVal : (seasonsVal?.data || []);
          const activeSeason = seasons.find((s) => s.status === 'active') || seasons[0] || null;

          const schedules = Array.isArray(schedulesVal) ? schedulesVal : (schedulesVal?.data || []);
          const records = Array.isArray(recordsVal) ? recordsVal : (recordsVal?.data || []);

          const pondDevices = deviceList.filter((d) => d.pondId === pond.id);
          const feederDevice = pondDevices.find((d) => d.type === 'feeder') || null;
          const sensorDevice = pondDevices.find((d) => d.type === 'sensor_node') || null;

          const enabledSchedules = schedules.filter((s) => s.isEnabled !== false);
          const targetKg = parseFloat(
            enabledSchedules.reduce((sum, s) => sum + Number(s.feedAmountKg || 0), 0).toFixed(1)
          );

          // Tính tổng lượng cám đã rải trong ngày hôm nay & trạng thái đang cho ăn
          const { sprayedKg, isFeeding, activeFeedingRecord } = summarizeFeedingRecords(records);

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

          const ageDays = calculateAgeDays(activeSeason?.stockingDate);

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
            isFeeding,
            activeFeedingRecord,
            dbStatus: pond.status || 'active',
            shrimpType: activeSeason?.name || 'Chưa khai báo vụ nuôi',
            stockingCount: activeSeason?.initialCount
              ? `${Number(activeSeason.initialCount).toLocaleString('vi-VN')} con`
              : 'Chưa thả giống',
            ageDays,
            doc: ageDays,
            activeSeason,
            hasTelemetry,
            telemetryMeasuredAt: hasTelemetry ? telemetry.measuredAt : null,
            do: hasTelemetry && telemetry.dissolvedOxygenMgL !== null ? Number(telemetry.dissolvedOxygenMgL) : null,
            ph: hasTelemetry && telemetry.ph !== null ? Number(telemetry.ph) : null,
            temp: hasTelemetry && telemetry.temperatureC !== null ? Number(telemetry.temperatureC) : null,
            salinity: hasTelemetry && telemetry.salinityPpt !== null ? Number(telemetry.salinityPpt) : null,
            nh3: hasTelemetry && telemetry.ammoniaMgL !== null ? Number(telemetry.ammoniaMgL) : null,
            turbidity: hasTelemetry && telemetry.turbidityNtu !== null ? Number(telemetry.turbidityNtu) : null,
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
            deviceId: feederDevice?.id || null,
          };
        })
      );

      // Gộp thêm lịch sử cho ăn thực tế & Safety Rule Engine của từng ao vào Nhật ký vận hành
      const feedingLogs = enrichedPonds.flatMap((pond) =>
        (pond.records || []).slice(0, 20).map((r) => {
          const isBlocked =
            r.safetyDecision === 'blocked' ||
            r.status === 'blocked_by_safety' ||
            (r.status === 'stopped' && Boolean(r.safetyReason));
          const amount = r.actualAmountKg ?? r.requestedAmountKg ?? 0;
          const timeVal = r.createdAt || r.startedAt || r.updatedAt;
          return {
            id: `feed-${r.id}`,
            kind: 'feeding',
            severityLevel: isBlocked ? 2 : 1,
            type: isBlocked ? 'alert' : 'info',
            title: isBlocked
              ? `CHẶN CHO ĂN AN TOÀN • ${pond.code}`
              : `CHO ĂN ${String(r.source || 'MANUAL').toUpperCase()} • ${pond.code}`,
            message: isBlocked
              ? r.safetyReason || r.stoppedReason || r.blockedReason || `Safety Engine chặn lệnh xả ${amount} kg.`
              : `Trạng thái: ${r.status || 'completed'} • Khối lượng: ${amount} kg.`,
            timestamp: formatLogTimestamp(timeVal),
            rawTime: new Date(timeVal || 0).getTime() || 0,
            pondId: pond.id,
            pondCode: pond.code,
            pondName: pond.name,
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
    allPondsRef.current = allPonds;
    pondIdSetRef.current = new Set(allPonds.map((p) => p.id));
  }, [allPonds]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    fetchAllRealDataRef.current = fetchAllRealData;
  }, [fetchAllRealData]);

  useEffect(() => {
    fetchAllRealData(false);
    const pollTimer = setInterval(() => {
      fetchAllRealData(true);
    }, 20000);
    return () => clearInterval(pollTimer);
  }, [fetchAllRealData]);

  const pondIdsKey = useMemo(() => allPonds.map((p) => p.id).join(','), [allPonds]);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      seenAlertIdsRef.current.clear();
      seenCompletedIdsRef.current.clear();
      return undefined;
    }

    socketService.connect();

    const toNumOrKeep = (incoming, fallback) => {
      if (incoming === undefined) return fallback;
      if (incoming === null) return null;
      const n = Number(incoming);
      return Number.isFinite(n) ? n : fallback;
    };

    const unsubTelemetry = socketService.onTelemetry((payload) => {
      if (!payload?.pondId) return;
      setAllPonds((prev) =>
        prev.map((pond) => {
          if (pond.id !== payload.pondId) return pond;
          return {
            ...pond,
            hasTelemetry: true,
            telemetryMeasuredAt:
              payload.measuredAt || payload.emittedAt || new Date().toISOString(),
            do: toNumOrKeep(payload.dissolvedOxygenMgL ?? payload.do, pond.do),
            ph: toNumOrKeep(payload.ph, pond.ph),
            temp: toNumOrKeep(payload.temperatureC ?? payload.temp, pond.temp),
            salinity: toNumOrKeep(payload.salinityPpt ?? payload.salinity, pond.salinity),
            nh3: toNumOrKeep(payload.ammoniaMgL ?? payload.nh3, pond.nh3),
            turbidity: toNumOrKeep(payload.turbidityNtu ?? payload.turbidity, pond.turbidity),
          };
        })
      );
    });

    const DEVICE_STATUSES = new Set(['online', 'offline', 'error']);

    const unsubFeederStatus = socketService.onFeederStatus((payload) => {
      if (!payload) return;
      const nextDeviceStatus = DEVICE_STATUSES.has(payload.deviceStatus)
        ? payload.deviceStatus
        : DEVICE_STATUSES.has(payload.status)
          ? payload.status
          : undefined;
      const nextMode =
        payload.mode ||
        (payload.command === 'STOP' || payload.command === 'EMERGENCY_STOP'
          ? 'emergency_stop'
          : undefined);

      if (nextMode === 'emergency_stop') {
        setIsEStopActive(true);
      }

      const hasDeviceFields = Boolean(
        nextDeviceStatus || nextMode || payload.hopperKg !== undefined
      );

      if (!hasDeviceFields && !payload.recordId) {
        return;
      }

      const matchesFeeder = (dev) => {
        if (!dev) return false;
        if (payload.deviceId && dev.id === payload.deviceId) return true;
        if (payload.deviceUid && dev.deviceUid === payload.deviceUid) return true;
        return Boolean(
          payload.pondId && dev.pondId === payload.pondId && dev.type === 'feeder'
        );
      };

      const mergeFeeder = (dev) => ({
        ...dev,
        ...(nextDeviceStatus ? { status: nextDeviceStatus } : {}),
        ...(nextMode ? { mode: nextMode } : {}),
        ...(payload.hopperKg !== undefined
          ? { metadata: { ...(dev.metadata || {}), hopperKg: Number(payload.hopperKg) } }
          : {}),
      });

      if (hasDeviceFields) {
        setDevices((prev) =>
          prev.map((d) => (matchesFeeder(d) ? mergeFeeder(d) : d))
        );
      }

      setAllPonds((prev) =>
        prev.map((pond) => {
          const pondMatch =
            (payload.pondId && pond.id === payload.pondId) ||
            matchesFeeder(pond.feederDevice);
          if (!pondMatch) return pond;

          let nextPond = pond;

          if (pond.feederDevice && hasDeviceFields) {
            const updatedFeeder = mergeFeeder(pond.feederDevice);
            const nextHopper =
              payload.hopperKg !== undefined ? Number(payload.hopperKg) : pond.hopperKg;
            nextPond = {
              ...nextPond,
              feederDevice: updatedFeeder,
              hopperKg: nextHopper,
              devices: (pond.devices || []).map((d) =>
                d.id === updatedFeeder.id ? updatedFeeder : d
              ),
            };
          }

          if (payload.recordId) {
            const existingRecords = nextPond.records || [];
            const hasRecord = existingRecords.some((r) => r.id === payload.recordId);
            const recordPatch = {
              ...(payload.status && !DEVICE_STATUSES.has(payload.status)
                ? { status: payload.status }
                : {}),
              ...(payload.actualAmountKg !== undefined && payload.actualAmountKg !== null
                ? { actualAmountKg: Number(payload.actualAmountKg) }
                : {}),
              ...(payload.requestedAmountKg !== undefined && payload.requestedAmountKg !== null
                ? { requestedAmountKg: Number(payload.requestedAmountKg) }
                : {}),
              ...(payload.safetyDecision ? { safetyDecision: payload.safetyDecision } : {}),
              ...(payload.stoppedReason !== undefined
                ? { stoppedReason: payload.stoppedReason }
                : {}),
              ...(payload.finishedAt !== undefined ? { finishedAt: payload.finishedAt } : {}),
            };

            let nextRecords = existingRecords;
            if (hasRecord) {
              nextRecords = existingRecords.map((r) =>
                r.id === payload.recordId ? { ...r, ...recordPatch } : r
              );
            } else if (payload.pondId && payload.pondId === pond.id) {
              nextRecords = [
                {
                  id: payload.recordId,
                  pondId: pond.id,
                  scheduleId: payload.scheduleId || null,
                  status: recordPatch.status || 'running',
                  requestedAmountKg: recordPatch.requestedAmountKg ?? 0,
                  actualAmountKg: recordPatch.actualAmountKg ?? null,
                  safetyDecision: recordPatch.safetyDecision || null,
                  stoppedReason: recordPatch.stoppedReason ?? null,
                  finishedAt: recordPatch.finishedAt ?? null,
                  createdAt: payload.emittedAt || new Date().toISOString(),
                },
                ...existingRecords,
              ];
            }

            const {
              sprayedKg: nextSprayedKg,
              isFeeding: nextIsFeeding,
              activeFeedingRecord: nextActiveFeedingRecord,
            } = summarizeFeedingRecords(nextRecords);

            nextPond = {
              ...nextPond,
              records: nextRecords,
              sprayedKg: nextSprayedKg,
              isFeeding: nextIsFeeding,
              activeFeedingRecord: nextActiveFeedingRecord,
            };
          }

          return nextPond;
        })
      );
    });

    const unsubFeedingCompleted = socketService.onFeedingCompleted((payload) => {
      if (!payload) return;
      const hasAccess =
        roleRef.current === 'admin' ||
        (payload.pondId && pondIdSetRef.current.has(payload.pondId));
      if (!hasAccess) return;

      const dedupeKey = String(
        payload.recordId || payload.id || payload.emittedAt || ''
      );
      if (dedupeKey && seenCompletedIdsRef.current.has(dedupeKey)) {
        return;
      }
      if (dedupeKey) {
        rememberSeenKey(seenCompletedIdsRef, dedupeKey);
      }

      const amountText =
        payload.actualAmountKg !== undefined && payload.actualAmountKg !== null
          ? payload.actualAmountKg
          : payload.requestedAmountKg ?? '';
      showToast(`Cữ ăn hoàn tất: Đã rải ${amountText} kg`, 'success');
      fetchAllRealDataRef.current?.(true);
    });

    const unsubDeviceStatus = socketService.onDeviceStatus((payload) => {
      if (!payload) return;
      if (payload.mode === 'emergency_stop') {
        setIsEStopActive(true);
      }

      const matchesDevice = (dev) => {
        if (!dev) return false;
        if (payload.deviceId && dev.id === payload.deviceId) return true;
        return Boolean(payload.deviceUid && dev.deviceUid === payload.deviceUid);
      };

      const mergeDevice = (dev) => ({
        ...dev,
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.mode ? { mode: payload.mode } : {}),
        ...(payload.lastSeenAt ? { lastSeenAt: payload.lastSeenAt } : {}),
        ...(payload.rssi !== undefined
          ? { metadata: { ...(dev.metadata || {}), rssiDbm: payload.rssi } }
          : {}),
      });

      setDevices((prev) =>
        prev.map((d) => (matchesDevice(d) ? mergeDevice(d) : d))
      );

      setAllPonds((prev) =>
        prev.map((pond) => {
          const hasMatch =
            matchesDevice(pond.feederDevice) ||
            matchesDevice(pond.sensorDevice) ||
            (pond.devices || []).some(matchesDevice);
          if (!hasMatch) return pond;
          return {
            ...pond,
            feederDevice: matchesDevice(pond.feederDevice)
              ? mergeDevice(pond.feederDevice)
              : pond.feederDevice,
            sensorDevice: matchesDevice(pond.sensorDevice)
              ? mergeDevice(pond.sensorDevice)
              : pond.sensorDevice,
            devices: (pond.devices || []).map((d) =>
              matchesDevice(d) ? mergeDevice(d) : d
            ),
          };
        })
      );
    });

    const unsubAlertNew = socketService.onAlertNew((alert) => {
      if (!alert) return;
      const hasAccess =
        roleRef.current === 'admin' ||
        (alert.pondId && pondIdSetRef.current.has(alert.pondId));
      if (!hasAccess) return;

      const isStatusTransition =
        alert.status === 'acknowledged' || alert.status === 'resolved';

      if (alert.id) {
        const dedupeKey = isStatusTransition
          ? `${alert.id}:${alert.status}`
          : String(alert.id);
        if (seenAlertIdsRef.current.has(dedupeKey)) {
          return;
        }
        rememberSeenKey(seenAlertIdsRef, dedupeKey);
      }

      const mappedAlert = mapAlertToLogItem(alert);
      setLogs((prev) => [mappedAlert, ...prev.filter((l) => l.id !== mappedAlert.id)]);
      setAlertRefreshKey((prev) => prev + 1);

      if (!alert.isBuffered && !isStatusTransition) {
        const sevNum = Number(alert.severity);
        const sevStr = String(alert.severity || '').toLowerCase();
        const toastKind =
          sevNum >= 3 || sevStr === 'critical'
            ? 'alert'
            : sevNum === 2 || sevStr === 'warning'
              ? 'warning'
              : 'info';
        showToast(alert.message || mappedAlert.title, toastKind);
      }
    });

    return () => {
      unsubTelemetry();
      unsubFeederStatus();
      unsubFeedingCompleted();
      unsubDeviceStatus();
      unsubAlertNew();
      socketService.disconnect();
    };
  }, [user, showToast]);

  useEffect(() => {
    if (!user) return;
    const ids = pondIdsKey ? pondIdsKey.split(',').filter(Boolean) : [];
    socketService.syncPondSubscriptions(ids);
  }, [user, pondIdsKey]);

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
    const targetDeviceId =
      activePond?.deviceId || filteredDevices.find((d) => d.type === 'feeder')?.id;
    try {
      if (targetDeviceId) {
        await deviceService.emergencyStop(targetDeviceId);
      }
      if (activePond?.activeFeedingRecord?.id) {
        await feedingService
          .updateRecord(activePond.activeFeedingRecord.id, { status: 'stopped' })
          .catch(() => {});
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 502 || status === 503) {
        showToast(
          getErrorMessage(
            err,
            'Đã kích hoạt dừng khẩn cấp trên hệ thống, nhưng MQTT Broker chưa kết nối để truyền lệnh xuống thiết bị.'
          ),
          'warning'
        );
      } else {
        showToast(getErrorMessage(err, 'Không thể gửi lệnh dừng khẩn cấp lên máy chủ Backend!'), 'alert');
      }
    }
    const nowIso = new Date().toISOString();
    const newLog = {
      id: Date.now().toString(),
      timestamp: formatLogTimestamp(nowIso),
      rawTime: Date.now(),
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

  const handleAlertsChanged = useCallback(() => {
    setAlertRefreshKey((prev) => prev + 1);
    fetchAllRealData(true);
  }, [fetchAllRealData]);

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
        onEmergencyStop={handleEmergencyStop}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        farms={farms}
        selectedFarmId={selectedFarmId}
        onSelectFarm={(fId) => setSelectedFarmId(fId)}
        ponds={filteredPonds}
        activePond={activePond}
        onSelectPond={(pId) => setSelectedPondId(pId)}
        alertRefreshKey={alertRefreshKey}
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
                  alertRefreshKey={alertRefreshKey}
                  onAlertsChanged={handleAlertsChanged}
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
                  alertRefreshKey={alertRefreshKey}
                  onAlertsChanged={handleAlertsChanged}
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
              path="/logs"
              element={
                <ScadaLogsView
                  logs={filteredLogs}
                  ponds={filteredPonds}
                  selectedFarmId={selectedFarmId}
                  alertRefreshKey={alertRefreshKey}
                  onAlertsChanged={handleAlertsChanged}
                  onShowToast={showToast}
                  onExport={(exportItems = filteredLogs) => {
                    const itemsToExport = Array.isArray(exportItems) ? exportItems : filteredLogs;
                    const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                    const csvContent = [
                      'Thời gian,Mã ao,Sự kiện,Nội dung,Loại,Trạng thái',
                      ...itemsToExport.map((l) =>
                        [
                          escapeCsv(l.timestamp),
                          escapeCsv(l.pondCode || 'TRẠM'),
                          escapeCsv(l.title),
                          escapeCsv(l.message),
                          escapeCsv(l.type),
                          escapeCsv(l.status || ''),
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
                  alertRefreshKey={alertRefreshKey}
                  onAlertsChanged={handleAlertsChanged}
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
