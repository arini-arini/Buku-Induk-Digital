import React, { useState, useEffect } from "react";
import { 
  Menu, 
  Sun, 
  Moon, 
  User, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  GraduationCap,
  Sparkles,
  LayoutDashboard,
  RefreshCw
} from "lucide-react";

import { api, getToken, clearToken, getUser } from "./lib/api";
import { UserRole, Student, Teacher, Report, AuditLog, SystemStats } from "./types";

// UI Components
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./components/AdminDashboard";
import GuruDashboard from "./components/GuruDashboard";
import SiswaDashboard from "./components/SiswaDashboard";
import TeacherManager from "./components/TeacherManager";
import AuditLogsView from "./components/AuditLogsView";
import BackupRestore from "./components/BackupRestore";
import ReportsManager from "./components/ReportsManager";

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAppLoaded, setIsAppLoaded] = useState<boolean>(false);
  
  // Tab control
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  // Core registries states
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalReports: 0,
    studentsPerClass: []
  });

  // Paginated student list state (for Admin)
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Global message alerts
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Sync dark theme with DOM class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("bg-slate-950", "text-slate-100");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("bg-slate-950", "text-slate-100");
    }
  }, [isDark]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 5000);
  };

  // Boot verification check
  useEffect(() => {
    const checkSession = async () => {
      const activeToken = getToken();
      const activeUser = getUser();

      if (activeToken && activeUser) {
        try {
          // verify session with server
          const verified = await api.getMe();
          setUser(verified.user);
          setToken(activeToken);
          // Set initial tab based on role
          if (verified.user.role === 'siswa') {
            setCurrentTab("dashboard");
          }
          showNotification('success', `Selamat datang kembali, ${verified.user.name}.`);
        } catch {
          clearToken();
          setUser(null);
          setToken(null);
        }
      }
      setIsAppLoaded(true);
    };

    checkSession();

    // Listen to unauthorized/expired session events from fetch wrappers
    const handleSessionExpiry = () => {
      setUser(null);
      setToken(null);
      showNotification('error', "Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
    };

    window.addEventListener("session-expired", handleSessionExpiry);
    return () => {
      window.removeEventListener("session-expired", handleSessionExpiry);
    };
  }, []);

  // Fetch contextual statistics and datasets based on active user role
  const loadData = async () => {
    if (!user) return;

    try {
      if (user.role === 'admin') {
        const statsRes = await api.getStats();
        setStats(statsRes);

        const teachersRes = await api.getTeachers();
        setTeachers(teachersRes);

        const reportsRes = await api.getReports({});
        setReports(reportsRes);

        const logsRes = await api.getLogs();
        setAuditLogs(logsRes);
      } else if (user.role === 'guru') {
        // Teacher stats
        const studentsRes = await api.getStudents("", user.classId || "all", 1);
        setStudents(studentsRes.students);

        const reportsRes = await api.getReports({ kelas: user.classId });
        setReports(reportsRes);
      } else if (user.role === 'siswa') {
        // Student self info and reports
        const studentsRes = await api.getStudents(user.username, "all", 1);
        setStudents(studentsRes.students);

        const reportsRes = await api.getReports({ sId: studentsRes.students[0]?.id });
        setReports(reportsRes);
      }
    } catch (err: any) {
      console.error("Gagal memuat dataset: ", err);
    }
  };

  // Trigger data loader whenever session changes or active tab shifts
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentTab]);

  // Handle manual login
  const handleLogin = async (username: string, pass: string) => {
    const res = await api.login(username, pass);
    setUser(res.user);
    setToken(res.token);
    setCurrentTab("dashboard");
    showNotification('success', `Berhasil Masuk! Selamat bekerja, ${res.user.name}.`);
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      clearToken();
      setUser(null);
      setToken(null);
      showNotification('success', "Anda telah berhasil keluar dari sistem.");
    }
  };

  // SINKRONISASI MANAJEMEN SISWA (ADMIN)
  const refreshStudentsGrid = async (q = "", classId = "all", page = 1) => {
    try {
      const res = await api.getStudents(q, classId, page);
      setStudents(res.students);
      setTotalStudentsCount(res.total);
      setTotalPages(res.totalPages);
      setCurrentPage(res.page);
    } catch (err: any) {
      showNotification('error', err.message || "Gagal memuat data siswa.");
    }
  };

  // Add Pupil
  const handleCreateStudent = async (studentPayload: Omit<Student, "id">) => {
    const newStudent = await api.createStudent(studentPayload);
    await loadData();
    return newStudent;
  };

  // Update Pupil
  const handleUpdateStudent = async (id: string, fields: Partial<Student>) => {
    const updated = await api.updateStudent(id, fields);
    await loadData();
    return updated;
  };

  // Delete Pupil
  const handleDeleteStudent = async (id: string) => {
    const res = await api.deleteStudent(id);
    await loadData();
    return res;
  };

  // Bulk Import Pupils
  const handleBulkImportStudents = async (importedList: any[]) => {
    const res = await api.importStudents(importedList);
    await loadData();
    return res;
  };

  // Reset Student Pass
  const handleResetStudentPass = async (id: string) => {
    const res = await api.resetStudentPassword(id);
    return res.message;
  };

  // SINKRONISASI MANAJEMEN GURU (ADMIN)
  const handleCreateTeacher = async (teacherPayload: Omit<Teacher, "id" | "username">) => {
    await api.createTeacher(teacherPayload);
    await loadData();
  };

  const handleUpdateTeacher = async (id: string, fields: Partial<Teacher>) => {
    await api.updateTeacher(id, fields);
    await loadData();
  };

  const handleDeleteTeacher = async (id: string) => {
    await api.deleteTeacher(id);
    await loadData();
  };

  const handleResetTeacherPass = async (id: string) => {
    const res = await api.resetTeacherPassword(id);
    return res.message;
  };

  // SINKRONISASI MANAJEMEN RAPOR (GURU)
  const handleUploadReport = async (reportPayload: any) => {
    await api.uploadReport(reportPayload);
    await loadData();
  };

  const handleDeleteReport = async (reportId: string) => {
    await api.deleteReport(reportId);
    await loadData();
  };

  // DATABASE BACKUP & RESTORE
  const handleBackupDatabase = async () => {
    return api.backupDatabase();
  };

  const handleRestoreDatabase = async (backupData: any) => {
    await api.restoreDatabase(backupData);
  };

  // Toggle mode
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Render content tab based on state
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        if (user?.role === 'admin') {
          return (
            <AdminDashboard
              stats={stats}
              students={students}
              onRefreshStats={loadData}
              onRefreshStudents={refreshStudentsGrid}
              onCreateStudent={handleCreateStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkImport={handleBulkImportStudents}
              onResetPassword={handleResetStudentPass}
              totalStudentsCount={totalStudentsCount}
              totalPages={totalPages}
              currentPage={currentPage}
              isDark={isDark}
            />
          );
        } else if (user?.role === 'guru') {
          return (
            <GuruDashboard
              teacher={user}
              students={students}
              reports={reports}
              onUploadReport={handleUploadReport}
              onDeleteReport={handleDeleteReport}
              isDark={isDark}
            />
          );
        } else if (user?.role === 'siswa') {
          return (
            <SiswaDashboard
              studentUser={user}
              students={students}
              reports={reports}
              isDark={isDark}
            />
          );
        }
        return null;

      case "students":
        return (
          <AdminDashboard
            stats={stats}
            students={students}
            onRefreshStats={loadData}
            onRefreshStudents={refreshStudentsGrid}
            onCreateStudent={handleCreateStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onBulkImport={handleBulkImportStudents}
            onResetPassword={handleResetStudentPass}
            totalStudentsCount={totalStudentsCount}
            totalPages={totalPages}
            currentPage={currentPage}
            isDark={isDark}
          />
        );

      case "teachers":
        return (
          <TeacherManager
            teachers={teachers}
            onCreate={handleCreateTeacher}
            onUpdate={handleUpdateTeacher}
            onDelete={handleDeleteTeacher}
            onResetPassword={handleResetTeacherPass}
            isDark={isDark}
          />
        );

      case "guru-reports":
        return (
          <ReportsManager
            students={students}
            reports={reports}
            onUpload={handleUploadReport}
            onDelete={handleDeleteReport}
            role="guru"
            currentClass={user?.classId}
            isDark={isDark}
          />
        );

      case "siswa-reports":
        return (
          <ReportsManager
            students={students}
            reports={reports}
            onUpload={async () => {}} // blank for readOnly Siswa
            role="siswa"
            isDark={isDark}
          />
        );

      case "audit-logs":
        return (
          <AuditLogsView
            logs={auditLogs}
            onRefresh={loadData}
            isDark={isDark}
          />
        );

      case "system-backup":
        return (
          <BackupRestore
            onBackup={handleBackupDatabase}
            onRestore={handleRestoreDatabase}
            isDark={isDark}
          />
        );

      default:
        return (
          <div className="p-8 text-center text-slate-400">
            Halaman sedang dalam pengembangan.
          </div>
        );
    }
  };

  // Boot check screen loading
  if (!isAppLoaded) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center transition-colors
        ${isDark ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-700"}
      `}>
        <div className="p-3 bg-blue-600 rounded-2xl text-white mb-4 animate-bounce">
          <GraduationCap size={36} />
        </div>
        <h2 className="text-sm font-bold tracking-widest uppercase">BUKU INDUK SD</h2>
        <span className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">Memuat sistem pengaman...</span>
        <RefreshCw size={20} className="animate-spin text-blue-500 mt-4" />
      </div>
    );
  }

  // Login view overlay
  if (!user) {
    return <Login onLogin={handleLogin} isDark={isDark} />;
  }

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`} id="applet-viewport">
      
      {/* Dynamic collapsing sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        role={user.role}
        userName={user.name}
        onLogout={handleLogout}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Container Layout */}
      <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300
        ${isCollapsed ? "pl-16" : "pl-16 md:pl-64"}
      `} id="print-ignore-container">
        
        {/* Top Header navbar (hides during printing) */}
        <header className={`sticky top-0 z-20 px-6 py-4 flex justify-between items-center border-b backdrop-blur-md
          ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}
        `} id="header-navbar">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 md:hidden"
            >
              <Menu size={18} />
            </button>
            
            <div>
              <h1 className="text-xs font-black uppercase tracking-wider text-slate-400">SD NEGERI 37 SUNGAI BANGEK</h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-sm font-extrabold capitalize text-slate-900 dark:text-white">
                  {currentTab === 'dashboard' ? 'Dashboard' : ''}
                  {currentTab === 'students' ? 'Buku Induk Siswa' : ''}
                  {currentTab === 'teachers' ? 'Manajemen Guru' : ''}
                  {currentTab === 'guru-reports' ? 'Kelola File Rapor' : ''}
                  {currentTab === 'siswa-reports' ? 'Biodata & Rapor' : ''}
                  {currentTab === 'audit-logs' ? 'Logs Digital' : ''}
                  {currentTab === 'system-backup' ? 'Backup / Recovery' : ''}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Quick theme status icon */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Ganti Tema Visual"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className={`p-2 rounded-2xl border flex items-center space-x-2
              ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"}
            `}>
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <span className="font-bold block max-w-[120px] truncate leading-none">{user.name}</span>
                <span className="text-[9px] text-slate-400 capitalize mt-0.5 block">{user.role} Portal</span>
              </div>
            </div>
          </div>
        </header>

        {/* Floating global dynamic toast alert */}
        {notif && (
          <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-start space-x-2 border text-xs max-w-sm animate-slideUp
            ${notif.type === 'success'
              ? "bg-emerald-600 border-emerald-500 text-white"
              : "bg-red-600 border-red-500 text-white"}
          `}>
            {notif.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
            <div>
              <span className="font-bold block">Notifikasi Sistem</span>
              <p className="mt-0.5 opacity-90 leading-relaxed font-medium">{notif.msg}</p>
            </div>
          </div>
        )}

        {/* Scroll Content Body */}
        <main className="p-6 flex-1 overflow-y-auto" id="main-content-canvas">
          {renderTabContent()}
        </main>
      </div>

      {/* Styled pure CSS inject for formal print layout overrides (Buku Induk catalog & Rapor sheets) */}
      <style>{`
        @media print {
          /* Hide sidebar, headers, scroll effects, backgrounds and icons */
          #print-ignore-container {
            padding-left: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          #header-navbar, aside, #sidebar-toggle-btn, button, a, select, input, form, #btn-add-student-trigger, #btn-export-excel, #btn-import-students-trigger, #btn-print-pdf-catalog {
            display: none !important;
          }
          #main-content-canvas {
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Expand preview reports and lists fully to 100% printed viewport */
          body {
            background-color: white !important;
            color: black !important;
            font-size: 11pt !important;
          }
          #report-print-canvas {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

    </div>
  );
}
