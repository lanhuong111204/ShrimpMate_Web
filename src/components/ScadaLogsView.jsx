import React, { useState } from 'react';
import { Search, Download, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';

export const ScadaLogsView = ({ logs, onExport }) => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (
      searchTerm &&
      !log.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.message.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-neutral-900 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              NHẬT KÝ VẬN HÀNH VÀ SỰ KIỆN SCADA
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Ghi vết toàn bộ thao tác máy ăn, tác động bảo vệ rơ-le khóa liên động và cảnh báo môi trường.
          </p>
        </div>

        <button
          onClick={onExport}
          className="h-8 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo (.CSV)</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <div className="flex gap-1 text-xs font-mono-num">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Tất cả ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('alert')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterType === 'alert'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Cảnh báo ({logs.filter((l) => l.type === 'alert').length})
            </button>
            <button
              onClick={() => setFilterType('info')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterType === 'info'
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Vận hành ({logs.filter((l) => l.type === 'info').length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo sự kiện, mã ao..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 pr-3 rounded-lg border border-neutral-200 text-xs font-mono-num w-full sm:w-64 focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-neutral-100 font-mono-num text-xs">
          {filteredLogs.map((log) => {
            const isAlert = log.type === 'alert';
            return (
              <div key={log.id} className="p-4 hover:bg-neutral-50/80 transition flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isAlert ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isAlert ? 'text-red-600' : 'text-neutral-900'}`}>
                        {log.title}
                      </span>
                      {log.pondId && (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px]">
                          AO SỐ 0{log.pondId}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400">{log.timestamp}</span>
                  </div>
                  <p className="text-neutral-600 font-sans mt-1 text-xs">{log.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
