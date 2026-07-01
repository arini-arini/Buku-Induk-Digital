import React from "react";
import { Award, User, Layers, Calendar, GraduationCap, ShieldCheck } from "lucide-react";
import { Student, Report } from "../types";
import ReportsManager from "./ReportsManager";

interface SiswaDashboardProps {
  studentUser: { name: string; username: string; id: string }; // User session
  students: Student[]; // All students, we will find the matching one
  reports: Report[]; // All reports, we will filter for matching siswaId
  isDark: boolean;
}

export default function SiswaDashboard({
  studentUser,
  students,
  reports,
  isDark,
}: SiswaDashboardProps) {
  
  // Find current student's full biodata in registry
  const studentBiodata = students.find(s => s.nisn === studentUser.username);
  
  // Filter report cards of this specific student
  const studentId = studentBiodata?.id || "N/A";
  const studentReports = reports.filter(r => r.siswaId === studentId);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden
        ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-gradient-to-r from-blue-600 to-emerald-600 border-blue-600 text-white"}
      `}>
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-20 h-20 rounded-full bg-white/5 translate-y-12 pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-block px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
            Hak Akses: Siswa
          </span>
          <h2 className="text-xl font-black mt-1 uppercase tracking-tight">Halo, {studentUser.name}!</h2>
          <p className="text-xs text-blue-100 dark:text-slate-400 mt-1 max-w-xl">
            Selamat datang di Portal Buku Induk SD Negeri 37 Sungai Bangek. Di sini Anda dapat memantau biodata terdaftar dan mengunduh berkas laporan hasil belajar (Rapor) secara mandiri.
          </p>
        </div>
      </div>

      {/* Student Profile Card (Biodata Board) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Details Block */}
        <div className={`md:col-span-1 p-5 rounded-2xl border flex flex-col items-center justify-between text-center relative overflow-hidden
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          {/* Subtle background graphics */}
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-500/5 pointer-events-none" />
          
          <div className="w-full flex flex-col items-center">
            {/* Visual student 3x4 photo frame */}
            <div className="mb-4">
              {studentBiodata?.foto ? (
                <img 
                  src={studentBiodata.foto} 
                  alt={studentUser.name} 
                  referrerPolicy="no-referrer"
                  className="w-[105px] h-[140px] object-cover rounded-lg border-2 border-blue-500 shadow-md mx-auto" 
                />
              ) : (
                <div className="w-[105px] h-[140px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-2 text-center text-slate-400 mx-auto">
                  <User size={30} className="mb-1" />
                  <span className="text-[9px] font-bold uppercase">Pas Foto 3x4</span>
                </div>
              )}
              <span className="text-[9px] font-mono mt-1 text-slate-400 uppercase tracking-wide block">Pas Foto Terdaftar</span>
            </div>

            <h3 className="font-extrabold text-sm uppercase text-slate-900 dark:text-white truncate max-w-full">
              {studentUser.name}
            </h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block">SD Negeri 37 Sungai Bangek</span>

            <span className="inline-block mt-3 px-3 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-[9px] font-bold uppercase tracking-wide">
              Murid {studentBiodata?.statusSiswa || "Aktif"}
            </span>
          </div>

          <div className={`w-full border-t mt-4 pt-4 text-xs space-y-2 text-left ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">No. Induk (NIS):</span>
              <strong className="font-mono">{studentBiodata?.nis || "N/A"}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">NISN Nasional:</span>
              <strong className="font-mono">{studentBiodata?.nisn || "N/A"}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Kelas:</span>
              <strong className="text-blue-600 dark:text-blue-400">Kelas {studentBiodata?.kelas || "N/A"}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Tahun Ajaran:</span>
              <strong className="font-mono">T.A {studentBiodata?.tahunAjaran || "N/A"}</strong>
            </div>
          </div>
        </div>

        {/* Info Blocks and Safety Guideline */}
        <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
          <div className={`p-5 rounded-2xl border flex-1 flex flex-col justify-between
            ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
          `}>
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <GraduationCap size={16} className="text-blue-500" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Arsip Lembar Buku Induk Saya</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Data Buku Induk adalah catatan resmi sekolah mengenai identitas diri Anda. Apabila terdapat kekeliruan cetak pada nama, tempat/tanggal lahir, atau nama orang tua, mohon segera hubungi **Operator Admin Sekolah** untuk dilakukan koreksi data.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Tempat Lahir</span>
                <strong>{studentBiodata?.tempatLahir || "-"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tanggal Lahir</span>
                <strong>{studentBiodata?.tanggalLahir || "-"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nama Ayah</span>
                <strong>{studentBiodata?.namaAyah || "-"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nama Ibu</span>
                <strong>{studentBiodata?.namaIbu || "-"}</strong>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-xs flex items-start space-x-2 text-blue-700 dark:text-blue-300">
            <ShieldCheck size={18} className="flex-shrink-0 text-blue-500 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Sistem Pengaman Portofolio:</strong> Portal ini terlindung enkripsi. Seluruh rekam jejak pengunggahan rapor digital dilakukan secara formal oleh guru kelas bimbingan Anda dan diaudit berkala.
            </div>
          </div>
        </div>

      </div>

      {/* Rapor PDF Downloader list (Reuses ReportsManager in secure read-only viewer mode for the current student) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
          <Layers size={14} className="text-blue-500" />
          <span>Lembar Portofolio Rapor Digital Saya</span>
        </h3>
        
        <ReportsManager
          students={studentBiodata ? [studentBiodata] : []}
          reports={studentReports}
          onUpload={async () => {}} // secure blank callbacks since students have read-only view
          role="siswa"
          isDark={isDark}
        />
      </div>

    </div>
  );
}
