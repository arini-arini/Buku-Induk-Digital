import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  Layers, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Pencil, 
  Trash2, 
  Key, 
  Eye, 
  Camera, 
  Trash, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  X,
  RefreshCw,
  Printer
} from "lucide-react";
import * as XLSX from "xlsx";
import { Student, SystemStats } from "../types";
import ExcelImportHelper from "./ExcelImportHelper";
import CropModal from "./CropModal";

interface AdminDashboardProps {
  stats: SystemStats;
  students: Student[];
  onRefreshStats: () => void;
  onRefreshStudents: (q?: string, kelas?: string, page?: number) => void;
  onCreateStudent: (student: Omit<Student, "id">) => Promise<any>;
  onUpdateStudent: (id: string, student: Partial<Student>) => Promise<any>;
  onDeleteStudent: (id: string) => Promise<any>;
  onBulkImport: (students: any[]) => Promise<any>;
  onResetPassword: (id: string) => Promise<string>;
  totalStudentsCount: number;
  totalPages: number;
  currentPage: number;
  isDark: boolean;
}

export default function AdminDashboard({
  stats,
  students,
  onRefreshStats,
  onRefreshStudents,
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkImport,
  onResetPassword,
  totalStudentsCount,
  totalPages,
  currentPage,
  isDark,
}: AdminDashboardProps) {
  
  // Search & Filter state
  const [search, setSearch] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  
  // Interactive Modal forms
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  
  // Photo crop states
  const [rawPhoto, setRawPhoto] = useState<string>("");
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);
  const [studentPhoto, setStudentPhoto] = useState<string>(""); // Base64 of cropped result

  // Student Form inputs
  const [nis, setNis] = useState<string>("");
  const [nisn, setNisn] = useState<string>("");
  const [namaLengkap, setNamaLengkap] = useState<string>("");
  const [tempatLahir, setTempatLahir] = useState<string>("");
  const [tanggalLahir, setTanggalLahir] = useState<string>("");
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>("L");
  const [agama, setAgama] = useState<string>("Islam");
  const [alamat, setAlamat] = useState<string>("");
  const [namaAyah, setNamaAyah] = useState<string>("");
  const [namaIbu, setNamaIbu] = useState<string>("");
  const [nomorHpOrangTua, setNomorHpOrangTua] = useState<string>("");
  const [kelas, setKelas] = useState<string>("1-A");
  const [tahunAjaran, setTahunAjaran] = useState<string>("2026/2027");
  const [statusSiswa, setStatusSiswa] = useState<'Aktif' | 'Lulus' | 'Pindah' | 'Keluar'>("Aktif");

  // Notifications
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const classesList = ["1-A", "1-B", "2-A", "2-B", "3-A", "3-B", "4-A", "4-B", "5-A", "5-B", "6-A", "6-B"];

  useEffect(() => {
    onRefreshStudents(search, selectedClass, 1);
  }, [selectedClass]);

  const handleSearchTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    onRefreshStudents(search, selectedClass, 1);
  };

  const triggerNotif = (type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 5000);
  };

  const openAddForm = () => {
    setEditingStudent(null);
    setNis("");
    setNisn("");
    setNamaLengkap("");
    setTempatLahir("");
    setTanggalLahir("");
    setJenisKelamin("L");
    setAgama("Islam");
    setAlamat("");
    setNamaAyah("");
    setNamaIbu("");
    setNomorHpOrangTua("");
    setKelas("1-A");
    setTahunAjaran("2026/2027");
    setStatusSiswa("Aktif");
    setStudentPhoto("");
    setIsFormOpen(true);
  };

  const openEditForm = (s: Student) => {
    setEditingStudent(s);
    setNis(s.nis);
    setNisn(s.nisn);
    setNamaLengkap(s.namaLengkap);
    setTempatLahir(s.tempatLahir);
    setTanggalLahir(s.tanggalLahir);
    setJenisKelamin(s.jenisKelamin);
    setAgama(s.agama);
    setAlamat(s.alamat);
    setNamaAyah(s.namaAyah);
    setNamaIbu(s.namaIbu);
    setNomorHpOrangTua(s.nomorHpOrangTua);
    setKelas(s.kelas);
    setTahunAjaran(s.tahunAjaran);
    setStatusSiswa(s.statusSiswa);
    setStudentPhoto(s.foto || "");
    setIsFormOpen(true);
  };

  // Form student photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      triggerNotif('error', "Format berkas harus gambar (JPG/PNG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawPhoto(reader.result as string);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64: string) => {
    setStudentPhoto(croppedBase64);
    setIsCropOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis || !nisn || !namaLengkap || !kelas) {
      triggerNotif('error', "Mohon lengkapi NIS, NISN, Nama Lengkap, dan Kelas.");
      return;
    }

    setLoading(true);
    const payload = {
      nis,
      nisn,
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      agama,
      alamat,
      namaAyah,
      namaIbu,
      nomorHpOrangTua,
      kelas,
      tahunAjaran,
      statusSiswa,
      foto: studentPhoto
    };

    try {
      if (editingStudent) {
        await onUpdateStudent(editingStudent.id, payload);
        triggerNotif('success', `Berhasil mengupdate siswa: ${namaLengkap}`);
      } else {
        await onCreateStudent(payload);
        triggerNotif('success', `Berhasil menambahkan siswa baru: ${namaLengkap}. Akun siswa otomatis aktif dengan username NISN.`);
      }
      setIsFormOpen(false);
      onRefreshStats();
      onRefreshStudents(search, selectedClass, currentPage);
    } catch (err: any) {
      triggerNotif('error', err.message || "Gagal menyimpan data siswa.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (s: Student) => {
    if (window.confirm(`Hapus siswa ${s.namaLengkap} dari Buku Induk?\nTindakan ini juga akan menghapus akun masuk dan seluruh file rapornya!`)) {
      try {
        await onDeleteStudent(s.id);
        triggerNotif('success', `Berhasil menghapus siswa ${s.namaLengkap}.`);
        onRefreshStats();
        onRefreshStudents(search, selectedClass, 1);
      } catch (err: any) {
        triggerNotif('error', err.message || "Gagal menghapus siswa.");
      }
    }
  };

  const handleResetPassword = async (s: Student) => {
    if (window.confirm(`Konfirmasi reset password akun siswa ${s.namaLengkap}?\nKredensial login akan dikembalikan ke standar bawaan: NISN + '123' (Contoh: ${s.nisn}123)`)) {
      try {
        const msg = await onResetPassword(s.id);
        triggerNotif('success', msg);
      } catch (err: any) {
        triggerNotif('error', err.message || "Gagal mereset password siswa.");
      }
    }
  };

  const handleBulkImportComplete = async (importedStudents: any[]) => {
    try {
      const res = await onBulkImport(importedStudents);
      triggerNotif('success', `Sukses Impor Masal! Berhasil mendaftarkan ${res.addedCount} siswa baru ke dalam sistem.`);
      setIsImportOpen(false);
      onRefreshStats();
      onRefreshStudents("", "all", 1);
    } catch (err: any) {
      triggerNotif('error', err.message || "Terjadi kesalahan impor masal.");
    }
  };

  // Export students list to formal Excel format using SheetJS
  const handleExportExcel = () => {
    const dataToExport = students.map((s, index) => ({
      "No": index + 1,
      "NIS": s.nis,
      "NISN": s.nisn,
      "Nama Lengkap": s.namaLengkap,
      "Kelas": s.kelas,
      "L/P": s.jenisKelamin,
      "Tempat Lahir": s.tempatLahir,
      "Tanggal Lahir": s.tanggalLahir,
      "Agama": s.agama,
      "Alamat Lengkap": s.alamat,
      "Nama Ayah": s.namaAyah,
      "Nama Ibu": s.namaIbu,
      "No HP Orang Tua": s.nomorHpOrangTua,
      "Tahun Ajaran": s.tahunAjaran,
      "Status Siswa": s.statusSiswa
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buku Induk");
    XLSX.writeFile(workbook, `Buku_Induk_Siswa_SDN37SungaiBangek_${new Date().getFullYear()}.xlsx`);
    triggerNotif('success', "Data Buku Induk siswa berhasil diekspor ke format Excel.");
  };

  // PDF Printing Catalog helper
  const handleExportPDF = () => {
    window.print();
    triggerNotif('success', "Mempersiapkan katalog cetak PDF...");
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Bento Grid Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all hover:scale-[1.02]
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-blue-500/5" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Siswa SD</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <Users size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
            {stats.totalStudents || students.length}
          </h2>
          <span className="text-[9px] text-slate-400 font-medium block mt-1">Siswa Terdaftar Buku Induk</span>
        </div>

        {/* Card 2: Total Teachers */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all hover:scale-[1.02]
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-green-500/5" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Guru Pengampu</span>
            <div className="p-1.5 rounded-lg bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300">
              <UserCheck size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-green-600 dark:text-green-400">
            {stats.totalTeachers || 2}
          </h2>
          <span className="text-[9px] text-slate-400 font-medium block mt-1">Tenaga Pendidik Aktif</span>
        </div>

        {/* Card 3: Total Classes */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all hover:scale-[1.02]
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-purple-500/5" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jumlah Rombel</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
              <Layers size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-purple-600 dark:text-purple-400">
            {stats.totalClasses || 6}
          </h2>
          <span className="text-[9px] text-slate-400 font-medium block mt-1">Kelas Aktif (Grade 1-6)</span>
        </div>

        {/* Card 4: Total Reports Uploaded */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all hover:scale-[1.02]
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-amber-500/5" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rapor Terunggah</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <FileText size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {stats.totalReports || 1}
          </h2>
          <span className="text-[9px] text-slate-400 font-medium block mt-1">Arsip Lembar Rapor PDF</span>
        </div>
      </div>

      {/* 2. Visual Student Populations Per Class Chart */}
      {stats.studentsPerClass && stats.studentsPerClass.length > 0 && (
        <div className={`p-5 rounded-2xl border
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp size={16} className="text-blue-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Grafik Jumlah Siswa per Rombel</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3 h-36 pt-6">
            {stats.studentsPerClass.map((bar, i) => {
              // find max for visual scaling
              const maxVal = Math.max(...stats.studentsPerClass.map(b => b.value), 1);
              const heightPercent = Math.max((bar.value / maxVal) * 100, 15);
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10 font-mono">
                    {bar.value} Anak
                  </div>
                  
                  {/* Animated Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300" 
                  />
                  <span className="text-[9px] font-mono font-bold mt-2 text-slate-400">{bar.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications bar */}
      {notif && (
        <div className={`p-4 rounded-xl flex items-start space-x-2 text-xs border animate-fadeIn
          ${notif.type === 'success' 
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300" 
            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300"}
        `}>
          {notif.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <p className="font-medium flex-1 leading-relaxed">{notif.msg}</p>
        </div>
      )}

      {/* 3. Bulk Excel Importer Toggle Section */}
      {isImportOpen && (
        <ExcelImportHelper
          existingStudents={students}
          onImportComplete={handleBulkImportComplete}
          isDark={isDark}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {/* 4. Buku Induk Student Registry Table view */}
      {!isImportOpen && (
        <div className={`p-5 rounded-2xl border
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">Registrasi Buku Induk Sekolah Dasar</h3>
              <p className="text-[10px] text-slate-500 mt-1">Cari, saring rombel kelas, ekspor rekam buku induk, dan kelola biodata otentik murid.</p>
            </div>

            {/* Admin actions list */}
            <div className="flex flex-wrap gap-2">
              {/* Import Excel Button */}
              <button
                onClick={() => setIsImportOpen(true)}
                className={`flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95
                  ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}
                `}
                id="btn-import-students-trigger"
              >
                <Upload size={14} />
                <span>Import (.xlsx)</span>
              </button>

              {/* Export Excel Button */}
              <button
                onClick={handleExportExcel}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/10 cursor-pointer"
                id="btn-export-excel"
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>

              {/* Export PDF Button (Print template catalogs) */}
              <button
                onClick={handleExportPDF}
                className={`flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95
                  ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}
                `}
                id="btn-print-pdf-catalog"
              >
                <Printer size={14} />
                <span>Cetak PDF</span>
              </button>

              {/* Add Student Button */}
              <button
                onClick={openAddForm}
                className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
                id="btn-add-student-trigger"
              >
                <Plus size={14} />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <form onSubmit={handleSearchTrigger} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan Nama, NIS, NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                  ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-800"}
                `}
                id="student-search-field"
              />
            </div>

            {/* Filter class select */}
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"}
                `}
                id="student-filter-class"
              >
                <option value="all">Semua Rombel</option>
                {classesList.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cari
            </button>
          </form>

          {/* Datagrid Students Table */}
          <div className="border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="buku-induk-table">
                <thead className={`font-bold text-xs
                  ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}
                `}>
                  <tr>
                    <th className="p-3 w-12 text-center">Foto</th>
                    <th className="p-3">NIS</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">L/P</th>
                    <th className="p-3">HP Orang Tua</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        <Users size={24} className="mx-auto mb-2 text-slate-300" />
                        Belum ada data siswa terdaftar di Buku Induk.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center">
                          {s.foto ? (
                            <img src={s.foto} alt={s.namaLengkap} referrerPolicy="no-referrer" className="w-8 h-10 object-cover rounded shadow border border-slate-200 dark:border-slate-800 mx-auto" />
                          ) : (
                            <div className="w-8 h-10 rounded bg-blue-50 dark:bg-blue-900/30 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 mx-auto">
                              3x4
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono font-medium">{s.nis}</td>
                        <td className="p-3 font-mono font-medium">{s.nisn}</td>
                        <td className="p-3">
                          <span className="font-bold block text-slate-900 dark:text-slate-100">{s.namaLengkap}</span>
                          <span className="text-[10px] text-slate-400 italic block">{s.tempatLahir}, {s.tanggalLahir}</span>
                        </td>
                        <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">Kelas {s.kelas}</td>
                        <td className="p-3">{s.jenisKelamin === 'L' ? "Laki-laki" : "Perempuan"}</td>
                        <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{s.nomorHpOrangTua || "-"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                            ${s.statusSiswa === 'Aktif' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
                            ${s.statusSiswa === 'Lulus' ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : ""}
                            ${s.statusSiswa === 'Pindah' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : ""}
                            ${s.statusSiswa === 'Keluar' ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : ""}
                          `}>
                            {s.statusSiswa}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end space-x-1">
                            {/* View Button */}
                            <button
                              onClick={() => setViewingStudent(s)}
                              className="p-1.5 border rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-100 dark:hover:border-blue-950 transition-colors"
                              title="Lihat Detail Profil"
                            >
                              <Eye size={12} />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => handleResetPassword(s)}
                              className="p-1.5 border rounded-lg text-slate-400 hover:text-purple-500 hover:border-purple-100 dark:hover:border-purple-950 transition-colors"
                              title="Reset Password Siswa (ke default)"
                            >
                              <Key size={12} />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditForm(s)}
                              className="p-1.5 border rounded-lg text-slate-400 hover:text-amber-500 hover:border-amber-100 dark:hover:border-amber-950 transition-colors"
                              title="Ubah Biodata Siswa"
                            >
                              <Pencil size={12} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 border rounded-lg text-slate-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-950 transition-colors"
                              title="Hapus Siswa dari Buku Induk"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple pagination footer */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center text-xs">
              <span className="text-slate-400">Total {totalStudentsCount} murid terdaftar.</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => onRefreshStudents(search, selectedClass, currentPage - 1)}
                  className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="font-bold">Halaman {currentPage} dari {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => onRefreshStudents(search, selectedClass, currentPage + 1)}
                  className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Detail Student Biodata Sheet Viewer */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl transition-all
            ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
          `}>
            {/* Modal Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center space-x-1.5">
                <Users size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm">Lembar Buku Induk: {viewingStudent.namaLengkap}</h3>
              </div>
              <button 
                onClick={() => setViewingStudent(null)} 
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Photo & Identity side by side */}
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Visual student 3x4 photo card */}
                <div className="flex-shrink-0 text-center mx-auto sm:mx-0">
                  {viewingStudent.foto ? (
                    <img src={viewingStudent.foto} alt={viewingStudent.namaLengkap} referrerPolicy="no-referrer" className="w-[120px] h-[160px] object-cover rounded-lg border-2 border-blue-500 shadow-md mx-auto" />
                  ) : (
                    <div className="w-[120px] h-[160px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-2 text-center text-slate-400 mx-auto">
                      <Camera size={24} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase">Pas Foto 3x4</span>
                    </div>
                  )}
                  <span className="text-[9px] font-mono mt-1 text-slate-400 uppercase tracking-wide block">Pas Foto Murid</span>
                </div>

                {/* Primary Student Meta */}
                <div className="flex-1 space-y-3">
                  <div className="border-b pb-2 dark:border-slate-800">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[9px] font-extrabold uppercase rounded-full">
                      Murid {viewingStudent.statusSiswa}
                    </span>
                    <h2 className="text-lg font-black mt-1 text-slate-900 dark:text-slate-100">{viewingStudent.namaLengkap}</h2>
                    <p className="text-xs text-slate-500">Siswa SD Negeri 37 Sungai Bangek • Kelas {viewingStudent.kelas}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div>
                      <span className="text-slate-400 block font-medium">Nomor Induk Siswa (NIS)</span>
                      <strong className="font-mono text-sm">{viewingStudent.nis}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">NISN (Nasional)</span>
                      <strong className="font-mono text-sm">{viewingStudent.nisn}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Tempat, Tanggal Lahir</span>
                      <strong>{viewingStudent.tempatLahir || "-"}, {viewingStudent.tanggalLahir || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Jenis Kelamin</span>
                      <strong>{viewingStudent.jenisKelamin === 'L' ? "Laki-laki (L)" : "Perempuan (P)"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced biodata details */}
              <div className="space-y-4 pt-4 border-t dark:border-slate-800 text-xs">
                <div>
                  <h4 className="font-bold text-xs mb-2 text-blue-500 uppercase tracking-wider">I. Keterangan Pribadi</h4>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
                    <div><span className="text-slate-400 font-medium">Agama</span>: {viewingStudent.agama}</div>
                    <div><span className="text-slate-400 font-medium">Tahun Ajaran Terdaftar</span>: T.A {viewingStudent.tahunAjaran}</div>
                    <div className="col-span-2"><span className="text-slate-400 font-medium">Alamat Tinggal</span>: {viewingStudent.alamat || "Belum diisi"}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs mb-2 text-blue-500 uppercase tracking-wider">II. Keterangan Orang Tua / Wali</h4>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
                    <div><span className="text-slate-400 font-medium">Nama Ayah</span>: {viewingStudent.namaAyah || "-"}</div>
                    <div><span className="text-slate-400 font-medium">Nama Ibu</span>: {viewingStudent.namaIbu || "-"}</div>
                    <div className="col-span-2"><span className="text-slate-400 font-medium">Nomor HP Hubungan Wali</span>: <strong className="font-mono">{viewingStudent.nomorHpOrangTua || "-"}</strong></div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-[10px] text-blue-700 dark:text-blue-300 rounded-xl leading-relaxed border border-blue-100 dark:border-blue-900/30">
                  <strong>Akun Default Siswa:</strong> Siswa dapat masuk menggunakan NIP/NISN mereka ({viewingStudent.nisn}) sebagai username dan kata sandi default <code>{viewingStudent.nisn}123</code>.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 flex justify-end border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add/Edit Student Form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <form 
            onSubmit={handleFormSubmit}
            className={`w-full max-w-2xl rounded-2xl border overflow-hidden shadow-xl my-8 transition-all
              ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
            `}
          >
            {/* Form Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center space-x-1.5">
                <Users size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm">
                  {editingStudent ? "Ubah Biodata Buku Induk Siswa" : "Daftarkan Siswa Baru (Buku Induk)"}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)} 
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Scroll Body */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              
              {/* Photo Upload with 3x4 layout crop preview */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b dark:border-slate-800">
                <div className="flex-shrink-0 text-center">
                  {studentPhoto ? (
                    <div className="relative group">
                      <img src={studentPhoto} alt="Student preview" referrerPolicy="no-referrer" className="w-[120px] h-[160px] object-cover rounded-lg border-2 border-blue-500 shadow-md" />
                      <button
                        type="button"
                        onClick={() => setStudentPhoto("")}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors cursor-pointer"
                        title="Hapus foto"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-[120px] h-[160px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <Camera size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">Foto 3x4</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h4 className="font-bold text-xs text-blue-500 uppercase tracking-wide">Pas Foto Siswa (3x4)</h4>
                  <p className="text-[10px] text-slate-400 max-w-sm">
                    Unggah pas foto siswa. Sistem akan otomatis membuka layar pangkas (Crop) agar pas foto memiliki ukuran proporsi 3x4 (Indonesian Student Photo Standard).
                  </p>
                  
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors mt-2">
                    <Camera size={14} />
                    <span>Pilih Foto</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Biodata Fields Grid */}
              <div className="space-y-4 text-xs">
                
                <h4 className="font-bold text-xs text-blue-500 uppercase tracking-wider">A. Nomor Identitas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nomor Induk Siswa (NIS) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 12001"
                      value={nis}
                      onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ""))}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">NISN (Nasional - 10 Digit) *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="Contoh: 0145239201"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ""))}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    />
                  </div>
                </div>

                <h4 className="font-bold text-xs text-blue-500 uppercase tracking-wider pt-2">B. Identitas Diri Siswa</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap Murid *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Fauzi"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jakarta"
                        value={tempatLahir}
                        onChange={(e) => setTempatLahir(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                          ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                        `}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                          ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                        `}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Jenis Kelamin *</label>
                      <select
                        value={jenisKelamin}
                        onChange={(e) => setJenisKelamin(e.target.value as any)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                          ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                        `}
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Agama</label>
                      <select
                        value={agama}
                        onChange={(e) => setAgama(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                          ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                        `}
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen">Kristen</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Konghucu">Konghucu</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Alamat Domisili Lengkap</label>
                    <textarea
                      placeholder="Contoh: Jl. Raya Sungai Bangek, Kel. Balai Gadang, Kec. Koto Tangah, Kota Padang"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    />
                  </div>
                </div>

                <h4 className="font-bold text-xs text-blue-500 uppercase tracking-wider pt-2">C. Orang Tua / Wali Murid</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Ayah Kandung</label>
                    <input
                      type="text"
                      placeholder="Nama Ayah"
                      value={namaAyah}
                      onChange={(e) => setNamaAyah(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Ibu Kandung</label>
                    <input
                      type="text"
                      placeholder="Nama Ibu"
                      value={namaIbu}
                      onChange={(e) => setNamaIbu(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">No HP Aktif Orang Tua / Wali *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081234567890"
                      value={nomorHpOrangTua}
                      onChange={(e) => setNomorHpOrangTua(e.target.value.replace(/[^0-9]/g, ""))}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    />
                  </div>
                </div>

                <h4 className="font-bold text-xs text-blue-500 uppercase tracking-wider pt-2">D. Informasi Akademik SD Negeri 37 Sungai Bangek</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pilih Kelas *</label>
                    <select
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    >
                      {classesList.map(c => (
                        <option key={c} value={c}>Kelas {c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tahun Ajaran *</label>
                    <select
                      value={tahunAjaran}
                      onChange={(e) => setTahunAjaran(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    >
                      <option value="2025/2026">2025/2026</option>
                      <option value="2026/2027">2026/2027</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status Siswa *</label>
                    <select
                      value={statusSiswa}
                      onChange={(e) => setStatusSiswa(e.target.value as any)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                        ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                      `}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Lulus">Lulus</option>
                      <option value="Pindah">Pindah</option>
                      <option value="Keluar">Keluar</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* Form Footer */}
            <div className={`p-4 flex justify-end space-x-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={loading}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors
                  ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
                `}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 flex items-center space-x-1 transition-all"
              >
                {loading ? <RefreshCw size={12} className="animate-spin" /> : null}
                <span>Simpan Buku Induk</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Hidden Image Crop Modal when trigger */}
      {isCropOpen && rawPhoto && (
        <CropModal
          imageSrc={rawPhoto}
          onCrop={handleCropComplete}
          onClose={() => setIsCropOpen(false)}
          isDark={isDark}
        />
      )}

    </div>
  );
}
