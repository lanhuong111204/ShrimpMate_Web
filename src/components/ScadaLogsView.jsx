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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Nhật ký vận hành & Cảnh báo
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi lịch sử hoạt động của máy cho ăn, trạng thái khóa an toàn và các cảnh báo môi trường nước.
          </p>
        </div>

        <button
          onClick={onExport}
          className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Xuất báo cáo (.CSV)</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('alert')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'alert'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cảnh báo ({logs.filter((l) => l.type === 'alert').length})
            </button>
            <button
              onClick={() => setFilterType('info')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'info'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Vận hành ({logs.filter((l) => l.type === 'info').length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo sự kiện, mã ao..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs w-full sm:w-64 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100 text-xs">
          {filteredLogs.map((log) => {
            const isAlert = log.type === 'alert';
            return (
              <div
                key={log.id}
                className={`p-4 flex items-start justify-between gap-4 transition ${
                  isAlert ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isAlert ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${isAlert ? 'text-red-700' : 'text-slate-900'}`}>
                        {log.title}
                      </span>
                      {log.pondId && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono-num text-[11px]">
                          Ao số {log.pondId}
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
      </div>
    </div>
  );
};
