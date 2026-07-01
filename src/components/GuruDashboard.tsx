import React from "react";
import { Award, Layers, Users, FileCheck, HelpCircle } from "lucide-react";
import { Student, Report, Teacher } from "../types";
import ReportsManager from "./ReportsManager";

interface GuruDashboardProps {
  teacher: { name: string; classId?: string; username: string };
  students: Student[];
  reports: Report[];
  onUploadReport: (report: any) => Promise<void>;
  onDeleteReport: (id: string) => Promise<void>;
  isDark: boolean;
}

export default function GuruDashboard({
  teacher,
  students,
  reports,
  onUploadReport,
  onDeleteReport,
  isDark,
}: GuruDashboardProps) {
  
  // Filter students to only include the class assigned to this teacher
  const classStudents = students.filter(s => s.kelas === teacher.classId);
  
  // Filter reports of this teacher's class
  const classReports = reports.filter(r => r.kelas === teacher.classId);

  // Calculate status of report cards uploaded vs total
  const totalStudents = classStudents.length;
  const uploadedCount = classStudents.filter(s => 
    reports.some(r => r.siswaId === s.id && r.kelas === teacher.classId)
  ).length;
  const pendingCount = Math.max(totalStudents - uploadedCount, 0);

  return (
    <div className="space-y-6">
      
      {/* Welcome Card & Statistics */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden
        ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white"}
      `}>
        {/* Abstract design vector overlay */}
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-24 h-24 rounded-full bg-white/5 translate-y-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
              Hak Akses: Guru Pengampu
            </span>
            <h2 className="text-xl font-black mt-1 uppercase tracking-tight">Selamat Datang, {teacher.name}!</h2>
            <p className="text-xs text-blue-100 dark:text-slate-400 mt-1">
              Anda bertanggung jawab mengelola, mengunggah, dan merevisi berkas rapor PDF untuk kelas bimbingan Anda.
            </p>
          </div>

          <div className="p-3 bg-white/10 dark:bg-slate-800/80 rounded-2xl border border-white/10 backdrop-blur-md flex items-center space-x-3 flex-shrink-0">
            <Award className="text-emerald-400 animate-bounce" size={24} />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wide block opacity-75">Kelas Bimbingan</span>
              <strong className="text-base font-black font-mono">KELAS {teacher.classId || "N/A"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats Grid for Class Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Total Students under supervision */}
        <div className={`p-4 rounded-xl border flex items-center space-x-3
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Siswa Bimbingan</span>
            <strong className="text-base font-black font-mono text-slate-900 dark:text-white">{totalStudents} Anak</strong>
          </div>
        </div>

        {/* Stat 2: Reports Uploaded */}
        <div className={`p-4 rounded-xl border flex items-center space-x-3
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
            <FileCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rapor Sudah Diunggah</span>
            <strong className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{uploadedCount} Rapor</strong>
          </div>
        </div>

        {/* Stat 3: Reports Pending */}
        <div className={`p-4 rounded-xl border flex items-center space-x-3
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <HelpCircle size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Belum Diunggah (Pending)</span>
            <strong className="text-base font-black font-mono text-amber-600 dark:text-amber-400">{pendingCount} Siswa</strong>
          </div>
        </div>
      </div>

      {/* Reusable Core Reports Panel configured in full edit/upload capability for the teacher's class */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
          <Layers size={14} className="text-blue-500" />
          <span>Panel Unggah dan Manajemen File Rapor PDF</span>
        </h3>
        
        <ReportsManager
          students={classStudents}
          reports={classReports}
          onUpload={onUploadReport}
          onDelete={onDeleteReport}
          role="guru"
          currentClass={teacher.classId}
          isDark={isDark}
        />
      </div>

    </div>
  );
}
