import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import deviceService from '../../services/deviceService';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Send, 
  Radio, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Activity,
  Layers
} from 'lucide-react';

export default function AdminMqttTestView() {
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [devices, setDevices] = useState([]);

  // Form State
  const [deviceUid, setDeviceUid] = useState('');
  const [feedAmountKg, setFeedAmountKg] = useState(1.5);
  const [spreadRateKgPerMinute, setSpreadRateKgPerMinute] = useState(1.0);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [sendingCommand, setSendingCommand] = useState(false);

  // Command History / Logs
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      type: 'INFO',
      message: 'Khởi tạo kênh giám sát MQTT Testing Console...',
    }
  ]);

  const addLog = (type, message, details = null) => {
    setLogs((prev) => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        type,
        message,
        details
      },
      ...prev
    ]);
  };

  const fetchBrokerStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await adminService.getMqttStatus();
      const statusData = res.data || res;
      setBrokerStatus(statusData);
      addLog('SUCCESS', `MQTT Broker Status: ${statusData.connected ? 'ONLINE' : 'OFFLINE'}`, statusData);
    } catch (err) {
      console.error('Lỗi kiểm tra broker:', err);
      setBrokerStatus({ connected: false, error: err.message });
      addLog('ERROR', `Không thể truy vấn MQTT Broker: ${err.message}`);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadFeederDevices = async () => {
    try {
      const res = await deviceService.getDevices();
      const list = Array.isArray(res) ? res : (res?.data || []);
      const feeders = list.filter((d) => d.type === 'feeder');
      setDevices(feeders);
      if (feeders.length > 0 && !deviceUid) {
        setDeviceUid(feeders[0].deviceUid);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách feeder:', err);
    }
  };

  useEffect(() => {
    fetchBrokerStatus();
    loadFeederDevices();
  }, []);

  const handleTestFeeder = async (e) => {
    e.preventDefault();
    if (!deviceUid.trim()) {
      alert('Vui lòng nhập hoặc chọn Device UID của máy cho ăn');
      return;
    }

    setSendingCommand(true);
    addLog('COMMAND', `Đang phát xung lệnh test FEEDER -> [${deviceUid.trim()}]`, {
      feedAmountKg,
      spreadRateKgPerMinute,
      durationSeconds,
      timestamp: new Date().toISOString()
    });

    try {
      const res = await adminService.testFeederMqtt(deviceUid.trim(), {
        feedAmountKg,
        spreadRateKgPerMinute,
        durationSeconds
      });

      const resData = res.data || res;
      addLog('SUCCESS', `Máy [${deviceUid.trim()}] đã phản hồi lệnh MQTT thành công!`, resData);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi gửi lệnh MQTT';
      addLog('ERROR', `Lỗi phát lệnh MQTT tới [${deviceUid.trim()}]: ${errMsg}`);
    } finally {
      setSendingCommand(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              KIỂM THỬ TRUYỀN THÔNG IOT (MQTT BROKER & FEEDER)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Giao diện kỹ thuật viên: Phát xung lệnh test máy cho ăn trực tiếp qua Broker, kiểm tra rơ-le và độ trễ phản hồi.
          </p>
        </div>

        <button
          onClick={fetchBrokerStatus}
          disabled={loadingStatus}
          className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Kiểm tra Broker</span>
        </button>
      </div>

      {/* BROKER STATUS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono-num text-neutral-500">
            <span className="uppercase font-semibold">Trạng thái Broker</span>
            {brokerStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Wifi className="w-3.5 h-3.5" /> ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                <WifiOff className="w-3.5 h-3.5" /> OFFLINE
              </span>
            )}
          </div>
          <p className="text-2xl font-bold font-mono-num text-neutral-900">
            {brokerStatus?.connected ? 'Đang hoạt động' : 'Mất kết nối'}
          </p>
          <p className="text-[11px] text-neutral-400 font-mono-num truncate pt-1 border-t border-neutral-100">
            URL: {brokerStatus?.brokerUrl || brokerStatus?.host || 'mqtt://broker.emqx.io:1883'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono-num text-neutral-500">
            <span className="uppercase font-semibold">Feeder Đã Ghi Nhận</span>
            <Cpu className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-2xl font-bold font-mono-num text-neutral-900">
            {devices.length} <span className="text-xs font-normal text-neutral-500 font-sans">máy cho ăn</span>
          </p>
          <p className="text-[11px] text-neutral-400 font-mono-num pt-1 border-t border-neutral-100">
            Sẵn sàng nhận topic `shrimpmate/devices/+/commands`
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono-num text-neutral-500">
            <span className="uppercase font-semibold">Độ trễ phản hồi</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono-num text-emerald-600">
            {brokerStatus?.pingMs ? `${brokerStatus.pingMs} ms` : '< 45 ms'}
          </p>
          <p className="text-[11px] text-neutral-400 font-mono-num pt-1 border-t border-neutral-100">
            QoS Level 1 (At least once delivery)
          </p>
        </div>
      </div>

      {/* MAIN TWO COLUMNS: Form Test & Console Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Phát Lệnh Test Feeder */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200">
              <Send className="w-4 h-4 text-red-600" />
              <h3 className="font-display font-bold text-xs uppercase text-neutral-900 tracking-wider">
                Gửi Xung Lệnh Test Feeder
              </h3>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Lệnh kiểm thử kỹ thuật viên sẽ gửi trực tiếp gói tin MQTT <code className="font-mono font-bold text-amber-900 bg-amber-100 px-1 py-0.2 rounded">FEED</code> tới thiết bị. Vui lòng đảm bảo an toàn xung quanh cối rải thức ăn.
              </p>
            </div>

            <form onSubmit={handleTestFeeder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Device UID Thiết bị *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: FEEDER_001"
                    value={deviceUid}
                    onChange={(e) => setDeviceUid(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-neutral-900 font-mono-num text-xs focus:outline-none focus:border-neutral-900"
                  />
                  {devices.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-neutral-500 self-center">Gợi ý:</span>
                      {devices.slice(0, 4).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDeviceUid(d.deviceUid)}
                          className="px-2 py-0.5 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded border border-neutral-200 font-mono-num transition cursor-pointer"
                        >
                          {d.deviceUid}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">
                    Lượng thức ăn (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={feedAmountKg}
                    onChange={(e) => setFeedAmountKg(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-neutral-900 font-mono-num text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">
                    Tốc độ rải (kg/phút)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={spreadRateKgPerMinute}
                    onChange={(e) => setSpreadRateKgPerMinute(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-neutral-900 font-mono-num text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">
                  Thời lượng xung test (giây)
                </label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  max="600"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-neutral-900 font-mono-num text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={sendingCommand}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {sendingCommand ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Đang phát xung MQTT...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Phát Xung Lệnh Test Feeder</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-3 border-t border-neutral-200 text-[11px] font-mono-num text-neutral-400 flex items-center justify-between">
            <span>Protocol: MQTT v3.1.1</span>
            <span>Retain: False</span>
          </div>
        </div>

        {/* Cửa sổ Console Log thời gian thực */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-xl flex flex-col h-[520px]">
          <div className="px-5 py-3 bg-neutral-900 border-b border-neutral-800 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono-num font-bold text-neutral-200">MQTT Command & Telemetry Logs</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
            >
              Xóa log
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono-num text-xs">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-600">
                Chưa có nhật ký lệnh nào được phát sinh.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border ${
                    log.type === 'ERROR'
                      ? 'bg-red-950/30 border-red-800/40 text-red-300'
                      : log.type === 'SUCCESS'
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : log.type === 'COMMAND'
                      ? 'bg-blue-950/30 border-blue-800/40 text-blue-300'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider">
                      [{log.type}] {log.timestamp}
                    </span>
                  </div>
                  <div className="text-neutral-200 text-xs">{log.message}</div>
                  {log.details && (
                    <pre className="mt-2 p-2 bg-black/50 rounded-lg text-[10px] overflow-x-auto text-neutral-400 font-mono-num">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
