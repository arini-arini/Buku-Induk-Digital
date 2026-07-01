import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileText, 
  ShieldAlert, 
  Database, 
  LogOut, 
  Sun, 
  Moon, 
  ChevronLeft, 
  Menu,
  GraduationCap
} from "lucide-react";
import { UserRole } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  role: UserRole;
  userName: string;
  onLogout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  role,
  userName,
  onLogout,
  isDark,
  toggleTheme,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  
  // Custom navigation items based on role
  const getNavItems = () => {
    const items = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "guru", "siswa"],
      },
      {
        id: "students",
        label: "Buku Induk Siswa",
        icon: Users,
        roles: ["admin"],
      },
      {
        id: "teachers",
        label: "Manajemen Guru",
        icon: UserCheck,
        roles: ["admin"],
      },
      {
        id: "guru-reports",
        label: "Kelola Rapor",
        icon: FileText,
        roles: ["guru"],
      },
      {
        id: "siswa-reports",
        label: "Rapor Saya",
        icon: FileText,
        roles: ["siswa"],
      },
      {
        id: "audit-logs",
        label: "Audit Log Aktivitas",
        icon: ShieldAlert,
        roles: ["admin"],
      },
      {
        id: "system-backup",
        label: "Backup & Restore",
        icon: Database,
        roles: ["admin"],
      },
    ];

    return items.filter((item) => item.roles.includes(role));
  };

  const navItems = getNavItems();

  return (
    <aside 
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 border-r flex flex-col justify-between
        ${isCollapsed ? "w-16" : "w-64"} 
        ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"}
      `}
    >
      {/* Sidebar Header */}
      <div>
        <div className={`p-4 flex items-center justify-between border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white flex-shrink-0 animate-pulse">
                <GraduationCap size={22} id="app-logo-icon" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight leading-none text-blue-600 dark:text-blue-400">
                  BUKU INDUK
                </span>
                <span className={`text-[10px] font-medium tracking-wide mt-0.5 uppercase ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Sistem Informasi SD
                </span>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="mx-auto p-1 bg-blue-600 text-white rounded-lg">
              <GraduationCap size={20} />
            </div>
          )}

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hidden md:block
              ${isDark ? "text-slate-400" : "text-slate-500"}
            `}
            id="sidebar-toggle-btn"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            <ChevronLeft size={16} className={`transform transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* User profile mini card */}
        {!isCollapsed && (
          <div className={`p-4 m-3 rounded-xl border text-center relative overflow-hidden
            ${isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-100"}
          `}>
            {/* Visual accent circles */}
            <div className="absolute -right-6 -bottom-6 w-12 h-12 rounded-full bg-blue-500/5 pointer-events-none" />
            <div className="absolute -left-6 -top-6 w-12 h-12 rounded-full bg-green-500/5 pointer-events-none" />

            <div className="mx-auto w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center font-bold text-white mb-2 shadow-sm uppercase">
              {userName.charAt(0)}
            </div>
            <h4 className="font-semibold text-xs truncate max-w-full" title={userName}>
              {userName}
            </h4>
            <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded-full
              ${role === 'admin' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : ""}
              ${role === 'guru' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : ""}
              ${role === 'siswa' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : ""}
            `}>
              {role}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center p-2.5 rounded-lg text-left text-xs font-medium transition-all group relative
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" 
                    : isDark 
                      ? "text-slate-300 hover:bg-slate-800/50 hover:text-white" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
                id={`nav-item-${item.id}`}
                title={isCollapsed ? item.label : ""}
              >
                <IconComponent size={18} className={`flex-shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                
                {/* Visual active border stripe */}
                {isActive && !isCollapsed && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className={`p-2 border-t flex flex-col space-y-1 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className={`flex items-center p-2 rounded-lg text-left text-xs font-medium transition-all
            ${isDark 
              ? "text-slate-300 hover:bg-slate-800 hover:text-white" 
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }
          `}
          id="theme-toggler"
          title={isDark ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
        >
          {isDark ? (
            <>
              <Sun size={18} className={`flex-shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
              {!isCollapsed && <span>Mode Terang</span>}
            </>
          ) : (
            <>
              <Moon size={18} className={`flex-shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
              {!isCollapsed && <span>Mode Gelap</span>}
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center p-2 rounded-lg text-left text-xs font-medium transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          id="logout-btn"
          title="Keluar dari Aplikasi"
        >
          <LogOut size={18} className={`flex-shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
