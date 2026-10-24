import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import deviceService from '../../services/deviceService';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Send, 
  Terminal, 
  AlertTriangle, 
  Cpu, 
  Activity
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#EA580C] rounded-full inline-block"></span>
            <h1 className="font-bold text-base md:text-lg text-[#0B1C30] tracking-tight">
              Kiểm thử truyền thông IoT (MQTT Broker & Feeder)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Giao diện kỹ thuật viên: Phát xung lệnh test máy cho ăn trực tiếp qua Broker, kiểm tra rơ-le và độ trễ phản hồi.
          </p>
        </div>

        <button
          onClick={fetchBrokerStatus}
          disabled={loadingStatus}
          className="px-4 py-2 bg-[#EFF4FF] hover:bg-[#D3E4FE] text-[#006398] border border-[#D3E4FE] font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
          <span>Kiểm tra Broker</span>
        </button>
      </div>

      {/* BROKER STATUS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#006E2D] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="uppercase font-bold tracking-wider">Trạng thái Broker</span>
            {brokerStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
                <Wifi className="w-3.5 h-3.5" /> ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30">
                <WifiOff className="w-3.5 h-3.5" /> OFFLINE
              </span>
            )}
          </div>
          <p className="text-2xl font-bold font-mono-num text-[#0B1C30]">
            {brokerStatus?.connected ? 'Đang hoạt động' : 'Mất kết nối'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono-num truncate pt-1.5 border-t border-slate-100">
            URL: {brokerStatus?.brokerUrl || brokerStatus?.host || 'mqtt://broker.emqx.io:1883'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#EA580C] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="uppercase font-bold tracking-wider">Feeder đã ghi nhận</span>
            <div className="w-7 h-7 rounded-lg bg-[#FFF8F5] text-[#EA580C] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono-num text-[#0B1C30]">
            {devices.length} <span className="text-xs font-normal text-slate-500 font-sans">máy cho ăn</span>
          </p>
          <p className="text-[11px] text-slate-400 font-mono-num pt-1.5 border-t border-slate-100">
            Topic: `shrimpmate/devices/+/commands`
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#006398] rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="uppercase font-bold tracking-wider">Độ trễ phản hồi</span>
            <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] text-[#006398] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono-num text-[#006E2D]">
            {brokerStatus?.pingMs ? `${brokerStatus.pingMs} ms` : '< 45 ms'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono-num pt-1.5 border-t border-slate-100">
            QoS Level 1 (At least once delivery)
          </p>
        </div>
      </div>

      {/* MAIN TWO COLUMNS: Form Test & Console Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Phát Lệnh Test Feeder */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Send className="w-4 h-4 text-[#EA580C]" />
              <h3 className="font-bold text-xs uppercase text-[#0B1C30] tracking-wider">
                Gửi xung lệnh Test Feeder
              </h3>
            </div>

            <div className="p-3.5 bg-[#FFF8F5] border border-[#FFDBCA] rounded-xl mb-5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#EA580C] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#9D4300] leading-relaxed">
                Lệnh kiểm thử kỹ thuật viên sẽ gửi trực tiếp gói tin MQTT <code className="font-mono font-bold text-[#EA580C] bg-[#FFDBCA]/60 px-1.5 py-0.5 rounded">FEED</code> tới thiết bị. Vui lòng đảm bảo an toàn xung quanh cối rải thức ăn.
              </p>
            </div>

            <form onSubmit={handleTestFeeder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1.5">
                  Device UID Thiết bị <span className="text-[#BA1A1A]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: FEEDER_001"
                    value={deviceUid}
                    onChange={(e) => setDeviceUid(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FF] border border-slate-200 rounded-xl text-[#0B1C30] font-mono-num text-xs focus:outline-none focus:border-[#EA580C]"
                  />
                  {devices.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-slate-500 self-center">Gợi ý:</span>
                      {devices.slice(0, 4).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDeviceUid(d.deviceUid)}
                          className="px-2.5 py-0.5 text-xs bg-[#EFF4FF] hover:bg-[#D3E4FE] text-[#006398] rounded-lg border border-[#D3E4FE] font-mono-num font-bold transition cursor-pointer"
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
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Lượng thức ăn (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={feedAmountKg}
                    onChange={(e) => setFeedAmountKg(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FF] border border-slate-200 rounded-xl text-[#0B1C30] font-mono-num text-xs focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Tốc độ rải (kg/phút)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={spreadRateKgPerMinute}
                    onChange={(e) => setSpreadRateKgPerMinute(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FF] border border-slate-200 rounded-xl text-[#0B1C30] font-mono-num text-xs focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Thời lượng xung test (giây)
                </label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  max="600"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F9FF] border border-slate-200 rounded-xl text-[#0B1C30] font-mono-num text-xs focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <button
                type="submit"
                disabled={sendingCommand}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-xs shadow-md shadow-[#EA580C]/20 transition cursor-pointer disabled:opacity-50"
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

          <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-mono-num text-slate-400 flex items-center justify-between">
            <span>Protocol: MQTT v3.1.1</span>
            <span>Retain: False</span>
          </div>
        </div>

        {/* Cửa sổ Console Log thời gian thực (Deep Ocean Navy #0B1C30) */}
        <div className="lg:col-span-7 bg-[#0B1C30] border border-[#1E293B] rounded-2xl shadow-xl flex flex-col h-[520px]">
          <div className="px-5 py-3.5 bg-[#131B2E] border-b border-[#1E293B] rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#7CF994]" />
              <span className="text-xs font-mono-num font-bold text-white">MQTT Command & Telemetry Logs</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-[#0B1C30] hover:bg-white/10 border border-[#1E293B] transition cursor-pointer"
            >
              Xóa log
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono-num text-xs">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Chưa có nhật ký lệnh nào được phát sinh.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border ${
                    log.type === 'ERROR'
                      ? 'bg-[#BA1A1A]/20 border-[#BA1A1A]/50 text-[#FFDAD6]'
                      : log.type === 'SUCCESS'
                      ? 'bg-[#006E2D]/25 border-[#7CF994]/40 text-[#7CF994]'
                      : log.type === 'COMMAND'
                      ? 'bg-[#EA580C]/20 border-[#FB923C]/40 text-[#FFDBCA]'
                      : 'bg-[#131B2E] border-[#1E293B] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider">
                      [{log.type}] {log.timestamp}
                    </span>
                  </div>
                  <div className="text-white text-xs">{log.message}</div>
                  {log.details && (
                    <pre className="mt-2 p-2.5 bg-black/40 rounded-lg text-[10px] overflow-x-auto text-slate-300 font-mono-num border border-white/5">
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
