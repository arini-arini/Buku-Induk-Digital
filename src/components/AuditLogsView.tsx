import React, { useState } from "react";
import { ShieldAlert, Search, RefreshCw, AlertCircle, Clock, User, Award, ArrowRightLeft } from "lucide-react";
import { AuditLog } from "../types";

interface AuditLogsViewProps {
  logs: AuditLog[];
  onRefresh: () => void;
  isDark: boolean;
}

export default function AuditLogsView({ logs, onRefresh, isDark }: AuditLogsViewProps) {
  const [search, setSearch] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("all");

  const actionsList = [
    { id: "all", label: "Semua Aktivitas" },
    { id: "LOGIN", label: "Login Masuk" },
    { id: "STUDENT", label: "Manajemen Siswa" },
    { id: "TEACHER", label: "Manajemen Guru" },
    { id: "REPORT", label: "Pengunggahan Rapor" },
    { id: "DATABASE", label: "Backup & Restore" },
  ];

  // Client-side search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());

    const matchesAction = 
      filterAction === "all" ||
      (filterAction === "STUDENT" && log.action.includes("STUDENT")) ||
      (filterAction === "TEACHER" && log.action.includes("TEACHER")) ||
      (filterAction === "REPORT" && log.action.includes("REPORT")) ||
      (filterAction === "DATABASE" && log.action.includes("DATABASE")) ||
      log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    let style = "";
    if (action.includes("CREATE")) style = "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
    else if (action.includes("UPDATE") || action.includes("REVISE")) style = "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
    else if (action.includes("DELETE")) style = "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
    else if (action === "LOGIN") style = "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
    else if (action.includes("BACKUP") || action.includes("RESTORE")) style = "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300";
    else style = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono ${style}`}>
        {action}
      </span>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Award size={14} className="text-blue-500" title="Admin Operator" />;
      case 'guru':
        return <User size={14} className="text-emerald-500" title="Guru Pengampu" />;
      default:
        return <User size={14} className="text-amber-500" title="Siswa" />;
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`p-6 rounded-2xl border h-full flex flex-col justify-between
      ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
    `}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <ShieldAlert size={22} className="text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="font-bold text-lg">Audit Log Aktivitas Sistem</h2>
              <p className="text-xs text-slate-500">Mencatat seluruh rekam jejak operasi administrator, guru pengampu, dan siswa demi keamanan sistem (Anti-Tamper).</p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className={`p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 flex items-center space-x-1 text-xs font-semibold cursor-pointer
              ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}
            `}
            title="Muat Ulang Logs"
            id="btn-refresh-logs"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh Logs</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari logs berdasarkan nama, detail, tindakan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-800"}
              `}
              id="logs-search-input"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {actionsList.map((act) => (
              <button
                key={act.id}
                onClick={() => setFilterAction(act.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${filterAction === act.id
                    ? "bg-blue-600 text-white"
                    : isDark
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }
                `}
                id={`filter-log-${act.id}`}
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datagrid logs */}
        <div className="border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className={`sticky top-0 z-10 font-bold text-xs
                ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}
              `}>
                <tr>
                  <th className="p-3 text-[11px] uppercase tracking-wide">Waktu Kejadian</th>
                  <th className="p-3 text-[11px] uppercase tracking-wide">Pengguna</th>
                  <th className="p-3 text-[11px] uppercase tracking-wide">Tindakan</th>
                  <th className="p-3 text-[11px] uppercase tracking-wide">Deskripsi Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
                      Tidak ada logs rekam aktivitas yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors`}>
                      <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {getRoleIcon(log.role)}
                          <div>
                            <span className="font-semibold block">{log.username}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{log.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="p-3 max-w-sm">
                        <p className={`font-medium leading-relaxed truncate ${isDark ? "text-slate-200" : "text-slate-700"}`} title={log.details}>
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center text-[11px] text-slate-400 border-t pt-3 dark:border-slate-800">
        <span>Menampilkan {filteredLogs.length} dari {logs.length} rekam jejak digital.</span>
        <span className="font-mono uppercase tracking-wider text-blue-500">Secured System</span>
      </div>
    </div>
  );
}
