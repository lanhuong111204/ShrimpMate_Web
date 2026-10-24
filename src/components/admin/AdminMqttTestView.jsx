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
      const res = await deviceService.getAllDevices();
      const list = res.data || res || [];
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Kiểm thử Truyền thông IoT (MQTT Broker)</h2>
              <p className="text-sm text-slate-400">
                Giao tiếp hai chiều với thiết bị phần cứng, phát lệnh test máy cho ăn tự động trực tiếp qua Broker.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchBrokerStatus}
          disabled={loadingStatus}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700/60 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Kiểm tra Broker</span>
        </button>
      </div>

      {/* BROKER STATUS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Trạng thái Broker</span>
            {brokerStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Wifi className="w-3.5 h-3.5" /> ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <WifiOff className="w-3.5 h-3.5" /> OFFLINE
              </span>
            )}
          </div>
          <p className="mt-3 text-2xl font-black text-white">
            {brokerStatus?.connected ? 'Đang hoạt động' : 'Mất kết nối'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Broker URL: {brokerStatus?.brokerUrl || brokerStatus?.host || 'mqtt://broker.emqx.io:1883'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Thiết bị Feeder Đã Ghi Nhận</span>
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="mt-3 text-2xl font-black text-indigo-400">
            {devices.length} <span className="text-sm font-normal text-slate-400">máy cho ăn</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Sẵn sàng nhận topic `shrimpmate/devices/+/commands`</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Độ trễ trung bình</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <p className="mt-3 text-2xl font-black text-amber-400">
            {brokerStatus?.pingMs ? `${brokerStatus.pingMs} ms` : '< 45 ms'}
          </p>
          <p className="text-xs text-slate-500 mt-1">QoS Level 1 (At least once delivery)</p>
        </div>
      </div>

      {/* MAIN TWO COLUMNS: Form Test & Console Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Phát Lệnh Test Feeder */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Send className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Gửi Xung Lệnh Test Feeder</h3>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Lệnh kiểm thử kỹ thuật viên sẽ gửi trực tiếp gói tin MQTT <code className="text-amber-300 font-mono">FEED</code> tới thiết bị. Vui lòng đảm bảo an toàn xung quanh cối rải thức ăn trước khi kích hoạt.
              </p>
            </div>

            <form onSubmit={handleTestFeeder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Device UID Thiết bị *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: FEEDER_001"
                    value={deviceUid}
                    onChange={(e) => setDeviceUid(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                  {devices.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-slate-400 self-center">Gợi ý nhanh:</span>
                      {devices.slice(0, 4).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDeviceUid(d.deviceUid)}
                          className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono transition"
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Lượng thức ăn (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={feedAmountKg}
                    onChange={(e) => setFeedAmountKg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Tốc độ rải (kg/phút)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={spreadRateKgPerMinute}
                    onChange={(e) => setSpreadRateKgPerMinute(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Thời lượng xung test (giây)
                </label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  max="600"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingCommand}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {sendingCommand ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang phát xung MQTT...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Phát Xung Lệnh Test Feeder</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
            <span>MQTT Protocol: v3.1.1</span>
            <span>Retain Flag: False</span>
          </div>
        </div>

        {/* Cửa sổ Console Log thời gian thực */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[520px]">
          <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-mono font-bold text-slate-300">MQTT Command & Telemetry Logs</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
            >
              Xóa log
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600">
                Chưa có nhật ký lệnh nào được phát sinh.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border ${
                    log.type === 'ERROR'
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                      : log.type === 'SUCCESS'
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : log.type === 'COMMAND'
                      ? 'bg-indigo-950/30 border-indigo-800/40 text-indigo-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider">
                      [{log.type}] {log.timestamp}
                    </span>
                  </div>
                  <div className="text-slate-200">{log.message}</div>
                  {log.details && (
                    <pre className="mt-2 p-2 bg-black/40 rounded-lg text-[10px] overflow-x-auto text-slate-400">
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
