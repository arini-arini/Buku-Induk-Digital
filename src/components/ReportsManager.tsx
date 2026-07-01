import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Plus, 
  X, 
  FileCheck, 
  Calendar,
  Layers,
  Award,
  BookOpen,
  Printer
} from "lucide-react";
import { Report, Student, Teacher } from "../types";

interface ReportsManagerProps {
  students: Student[]; // Students assigned to this teacher's class or current student
  reports: Report[];
  onUpload: (report: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  role: 'admin' | 'guru' | 'siswa';
  currentClass?: string; // Teacher's class
  isDark: boolean;
}

export default function ReportsManager({
  students,
  reports,
  onUpload,
  onDelete,
  role,
  currentClass,
  isDark,
}: ReportsManagerProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState<string>("");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
  // Upload dialog form states
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadStudent, setUploadStudent] = useState<Student | null>(null);
  const [academicYear, setAcademicYear] = useState<string>("2026/2027");
  const [semester, setSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [keterangan, setKeterangan] = useState<string>("");
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  
  // Previewing Report State
  const [activePreview, setActivePreview] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const triggerNotif = (type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4000);
  };

  // Pre-fill student for uploading if requested
  const openUploadForStudent = (student: Student) => {
    setUploadStudent(student);
    setAcademicYear(student.tahunAjaran || "2026/2027");
    setSemester("Ganjil");
    setKeterangan(`Rapor Semester Ganjil TA ${student.tahunAjaran || "2026/2027"}`);
    setFileBase64("");
    setFileName("");
    setIsUploadOpen(true);
  };

  // Convert uploaded PDF to base64 for database storage
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== "application/pdf") {
      triggerNotif('error', "Hanya diperbolehkan mengunggah berkas format PDF.");
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      triggerNotif('error', "Maksimum ukuran berkas PDF adalah 5 Megabytes.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadStudent || !fileBase64 || !fileName) {
      triggerNotif('error', "Mohon lengkapi seluruh isian dan unggah berkas PDF.");
      return;
    }

    setLoading(true);
    try {
      await onUpload({
        siswaId: uploadStudent.id,
        kelas: uploadStudent.kelas,
        tahunAjaran: academicYear,
        semester: semester,
        fileUrl: fileBase64,
        fileName: fileName,
        keterangan: keterangan
      });
      triggerNotif('success', `Berhasil mengunggah rapor untuk siswa ${uploadStudent.namaLengkap}.`);
      setIsUploadOpen(false);
    } catch (err: any) {
      triggerNotif('error', err.message || "Gagal mengunggah file rapor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (report: Report) => {
    if (!onDelete) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus rapor ${report.namaSiswa} semester ${report.semester}?\nTindakan ini permanen.`)) {
      try {
        await onDelete(report.id);
        triggerNotif('success', "File rapor berhasil dihapus.");
        if (activePreview?.id === report.id) {
          setActivePreview(null);
        }
      } catch (err: any) {
        triggerNotif('error', err.message || "Gagal menghapus rapor.");
      }
    }
  };

  // Filter students based on teacher search query
  const filteredStudents = students.filter(s =>
    s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
    s.nis.includes(search) ||
    s.nisn.includes(search)
  );

  // Filtered reports
  const filteredReports = reports.filter(r => {
    const matchesSemester = filterSemester === "all" || r.semester === filterSemester;
    const matchesYear = filterYear === "all" || r.tahunAjaran === filterYear;
    return matchesSemester && matchesYear;
  });

  // Check if a student already has a report uploaded
  const getStudentReportStatus = (studentId: string) => {
    const count = reports.filter(r => r.siswaId === studentId).length;
    return count > 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Left Grid: Student List with Upload Status (Only for Admin/Guru) */}
      {role !== 'siswa' && (
        <div className={`p-5 rounded-2xl border lg:col-span-1 flex flex-col justify-between h-[600px]
          ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
        `}>
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">Daftar Siswa Kelas {currentClass || "Semua"}</h3>
              <p className="text-[10px] text-slate-400">Pilih siswa untuk melihat riwayat atau mengunggah berkas rapor baru.</p>
            </div>

            {/* Student Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all
                  ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-800"}
                `}
                id="report-student-search"
              />
            </div>

            {/* Students List Scrolling container */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-xs">Siswa tidak ditemukan.</p>
              ) : (
                filteredStudents.map((student) => {
                  const hasReport = getStudentReportStatus(student.id);
                  const isSelected = selectedStudent?.id === student.id;

                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]
                        ${isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                          : isDark
                            ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800"
                            : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                        }
                      `}
                      id={`student-report-row-${student.id}`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 text-xs">
                          {student.namaLengkap.charAt(0)}
                        </div>
                        <div className="truncate">
                          <h4 className="font-semibold text-xs truncate max-w-[130px]">{student.namaLengkap}</h4>
                          <span className={`text-[9px] font-mono block ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                            NISN: {student.nisn}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {hasReport ? (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center space-x-0.5
                            ${isSelected 
                              ? "bg-emerald-500 text-white" 
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}
                          >
                            <FileCheck size={10} />
                            <span className="hidden sm:inline">Ada Rapor</span>
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center space-x-0.5
                            ${isSelected 
                              ? "bg-slate-500 text-white" 
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}
                          >
                            <AlertCircle size={10} />
                            <span className="hidden sm:inline">Belum</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 text-center border-t pt-2 dark:border-slate-800">
            Total siswa: {students.length} anak
          </div>
        </div>
      )}

      {/* 2. Middle/Right Grid: Report History and Details Viewer (For selected student or Current Student self) */}
      <div className={`p-5 rounded-2xl border h-[600px] flex flex-col justify-between
        ${role === 'siswa' ? "lg:col-span-3" : "lg:col-span-2"}
        ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
      `}>
        <div>
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm flex items-center space-x-1.5">
                <FileText size={16} className="text-blue-500" />
                <span>
                  {role === 'siswa' 
                    ? `Berkas Rapor Saya (${students[0]?.namaLengkap || ""})` 
                    : selectedStudent 
                      ? `Arsip Rapor: ${selectedStudent.namaLengkap}` 
                      : "Pilih Siswa untuk Mengelola Rapor"
                  }
                </span>
              </h3>
              {role !== 'siswa' && selectedStudent && (
                <span className="text-[10px] font-mono text-slate-400">
                  NIS: {selectedStudent.nis} | NISN: {selectedStudent.nisn} | Kelas {selectedStudent.kelas}
                </span>
              )}
            </div>

            {/* Upload Button for Guru on selected student */}
            {role !== 'siswa' && selectedStudent && (
              <button
                onClick={() => openUploadForStudent(selectedStudent)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
                id="btn-upload-pdf-trigger"
              >
                <Plus size={12} />
                <span>Unggah Rapor PDF</span>
              </button>
            )}
          </div>

          {/* Notification inside component */}
          {notif && (
            <div className={`p-3 mb-3 rounded-lg flex items-center space-x-2 text-xs border
              ${notif.type === 'success' 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300" 
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300"}
            `}>
              {notif.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              <span className="font-medium">{notif.msg}</span>
            </div>
          )}

          {/* Reports History List */}
          {(!selectedStudent && role !== 'siswa') ? (
            <div className="h-96 flex flex-col justify-center items-center text-slate-400 text-xs">
              <FileText size={40} className="text-slate-300 dark:text-slate-800 mb-2" />
              <span>Silakan pilih salah satu siswa di panel sebelah kiri untuk melihat arsip rapor kelas.</span>
            </div>
          ) : (
            <div>
              {/* Filter Row */}
              <div className="flex gap-2 mb-4">
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500
                    ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"}
                  `}
                >
                  <option value="all">Semua Semester</option>
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>

                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500
                    ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"}
                  `}
                >
                  <option value="all">Semua Tahun Ajaran</option>
                  <option value="2025/2026">T.A 2025/2026</option>
                  <option value="2026/2027">T.A 2026/2027</option>
                </select>
              </div>

              {/* Reports Grid List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                {filteredReports.filter(r => role === 'siswa' || r.siswaId === selectedStudent?.id).length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 text-xs border rounded-xl border-dashed border-slate-200 dark:border-slate-800">
                    <Calendar size={24} className="mx-auto mb-2 text-slate-300" />
                    Belum ada riwayat rapor yang diunggah untuk semester/T.A ini.
                  </div>
                ) : (
                  filteredReports
                    .filter(r => role === 'siswa' || r.siswaId === selectedStudent?.id)
                    .map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-sm
                          ${isDark ? "bg-slate-800/20 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-100 hover:border-slate-200"}
                        `}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300 flex-shrink-0">
                                <FileText size={16} />
                              </div>
                              <div className="truncate">
                                <h4 className="font-bold text-xs truncate max-w-[150px]" title={report.fileName}>
                                  {report.fileName}
                                </h4>
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  T.A {report.tahunAjaran} • Sem. {report.semester}
                                </span>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[8px] font-bold rounded">
                              Kelas {report.kelas}
                            </span>
                          </div>

                          <p className={`text-[10px] mt-2 italic leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            "{report.keterangan || "Laporan Semester"}"
                          </p>

                          <div className="mt-3 text-[9px] text-slate-400 space-y-0.5">
                            <div>Pengunggah: <strong>{report.uploadedBy}</strong></div>
                            <div>Diunggah: <strong>{new Date(report.uploadedAt).toLocaleDateString("id-ID")}</strong></div>
                          </div>
                        </div>

                        {/* Interactive triggers */}
                        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          {/* Preview PDF */}
                          <button
                            onClick={() => setActivePreview(report)}
                            className="px-2 py-1 border rounded text-[10px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye size={10} />
                            <span>Buka Preview</span>
                          </button>

                          {/* Download Link */}
                          <a
                            href={report.fileUrl}
                            download={report.fileName}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-semibold flex items-center space-x-1 shadow-sm"
                          >
                            <Download size={10} />
                            <span>Unduh PDF</span>
                          </a>

                          {/* Delete (only teacher/admin can delete) */}
                          {role !== 'siswa' && onDelete && (
                            <button
                              onClick={() => handleDeleteReport(report)}
                              className="p-1 border rounded text-slate-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-950 transition-colors"
                              title="Hapus berkas rapor"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-400 border-t pt-2 dark:border-slate-800 text-right">
          Sistem Terenkripsi • Penyimpanan PDF Mandiri
        </div>
      </div>

      {/* 3. Pop-up Upload Dialog */}
      {isUploadOpen && uploadStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form 
            onSubmit={handleFormSubmit}
            className={`w-full max-w-md rounded-2xl border overflow-hidden shadow-xl transition-all
              ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
            `}
          >
            {/* Modal Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center space-x-1.5">
                <Upload size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm">Unggah Rapor: {uploadStudent.namaLengkap}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsUploadOpen(false)} 
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Academic Year */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tahun Ajaran *</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                      ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                    `}
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as any)}
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                      ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                    `}
                  >
                    <option value="Ganjil">Ganjil (1)</option>
                    <option value="Genap">Genap (2)</option>
                  </select>
                </div>
              </div>

              {/* Description Keterangan */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Keterangan / Deskripsi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapor Penilaian Akhir Semester (PAS)"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500
                    ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                  `}
                />
              </div>

              {/* Drag n drop PDF box */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Berkas Rapor PDF (Max 5MB) *</label>
                <label className={`border-2 border-dashed rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer transition-colors p-3 text-center
                  ${isDark 
                    ? "border-slate-700 hover:border-blue-500 bg-slate-800/10 hover:bg-slate-800/40" 
                    : "border-slate-200 hover:border-blue-600 bg-slate-50 hover:bg-slate-100"}
                `}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <FileText size={24} className="text-red-500 mb-1" />
                  <span className="font-bold text-[11px] block">{fileName || "Klik untuk Pilih File PDF"}</span>
                  <span className="text-[9px] text-slate-400">{fileName ? "File terpilih" : "Hanya diperbolehkan format .pdf"}</span>
                </label>
              </div>

              {/* Revision warning detector */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] leading-relaxed border border-amber-200/50 dark:border-amber-900/30">
                <strong>Catatan Revisi:</strong> Jika file rapor untuk Semester & T.A yang sama sudah pernah diunggah, sistem akan secara otomatis mendeteksi dan memperbaruinya sebagai versi revisi terbaru.
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 flex justify-end space-x-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                disabled={loading}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors
                  ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
                `}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !fileBase64}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {loading ? <Calendar size={12} className="animate-spin" /> : null}
                <span>Mulai Unggah</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Full PDF / Report Preview Mock Modal overlay */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-4xl h-[90vh] rounded-2xl border overflow-hidden shadow-2xl flex flex-col justify-between transition-all
            ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
          `}>
            {/* Modal Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center space-x-2">
                <FileText size={20} className="text-red-500" />
                <div>
                  <h3 className="font-bold text-sm">Preview Rapor Siswa</h3>
                  <span className="text-[10px] text-slate-400 block">{activePreview.fileName}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Print simulator */}
                <button
                  onClick={() => window.print()}
                  className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-all
                    ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}
                  `}
                  title="Cetak Berkas"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Cetak Rapor</span>
                </button>

                <button 
                  onClick={() => setActivePreview(null)} 
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body - Styled Interactive Report Card Template */}
            <div className="p-8 flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950/40">
              
              <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 shadow-md rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" id="report-print-canvas">
                
                {/* School Header */}
                <div className="text-center border-b-2 border-slate-900 dark:border-slate-300 pb-4 mb-6">
                  <h2 className="text-lg font-bold uppercase tracking-wide">Pemerintah Kota Padang</h2>
                  <h1 className="text-xl font-extrabold uppercase tracking-widest text-blue-600">SD NEGERI 37 SUNGAI BANGEK</h1>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Jl. Raya Sungai Bangek, Kel. Balai Gadang, Kec. Koto Tangah, Kota Padang | Telp: 0751-123456</p>
                </div>

                {/* Report Meta Section */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-b pb-4 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex"><span className="w-24 text-slate-400 font-medium">Nama Siswa</span><span>: <strong>{activePreview.namaSiswa}</strong></span></div>
                    <div className="flex"><span className="w-24 text-slate-400 font-medium">Kelas</span><span>: Kelas {activePreview.kelas}</span></div>
                    <div className="flex"><span className="w-24 text-slate-400 font-medium">Tahun Ajaran</span><span>: T.A {activePreview.tahunAjaran}</span></div>
                  </div>
                  <div className="space-y-1 text-right sm:text-left sm:pl-12">
                    <div className="flex sm:justify-start"><span className="w-24 text-slate-400 font-medium">ID Rapor</span><span>: <strong className="font-mono text-[10px] text-slate-500">{activePreview.id}</strong></span></div>
                    <div className="flex sm:justify-start"><span className="w-24 text-slate-400 font-medium">Semester</span><span>: {activePreview.semester} ({activePreview.semester === 'Ganjil' ? '1' : '2'})</span></div>
                    <div className="flex sm:justify-start"><span className="w-24 text-slate-400 font-medium">Keterangan</span><span>: {activePreview.keterangan || "Penilaian Akhir"}</span></div>
                  </div>
                </div>

                {/* Substantive mock subject table to present high professionalism */}
                <div className="mb-6">
                  <h3 className="font-bold text-xs mb-2 uppercase tracking-wider text-blue-600">Laporan Capaian Nilai Pembelajaran</h3>
                  <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold">
                      <tr>
                        <th className="border border-slate-300 dark:border-slate-700 p-2.5 w-12 text-center">No</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2.5">Mata Pelajaran</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2.5 w-20 text-center">KKM</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2.5 w-24 text-center">Nilai Angka</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2.5 w-24 text-center">Predikat</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2.5">Deskripsi Capaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">1</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium">Pendidikan Agama & Budi Pekerti</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">75</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold font-mono">88</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold text-emerald-500">A</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-[11px]">Sangat baik dalam memahami pilar keimanan dan akhlak terpuji.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">2</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium">Pendidikan Pancasila & Kewarganegaraan</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">75</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold font-mono">85</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold text-emerald-500">A</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-[11px]">Memahami simbol sila Pancasila dan gotong royong dengan baik.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">3</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium">Bahasa Indonesia</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">70</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold font-mono">92</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold text-emerald-500">A</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-[11px]">Sangat terampil membaca teks naratif dan menyusun kalimat efektif.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">4</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium">Matematika</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">70</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold font-mono">79</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold text-blue-500">B</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-[11px]">Baik dalam pemecahan soal perkalian dan pembagian dasar.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">5</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium">Ilmu Pengetahuan Alam & Sosial (IPAS)</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center">75</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold font-mono">83</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold text-blue-500">B</td>
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-[11px]">Memahami metamorfosis makhluk hidup dan siklus air bumi.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Substantive comments and extra ratings */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-8">
                  <div className="border border-slate-300 dark:border-slate-700 p-3 rounded-lg">
                    <strong className="block mb-1 text-blue-600">Kehadiran (Absensi):</strong>
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>Sakit (S)</span><span>: 0 hari</span></div>
                      <div className="flex justify-between"><span>Izin (I)</span><span>: 1 hari</span></div>
                      <div className="flex justify-between"><span>Tanpa Keterangan (A)</span><span>: 0 hari</span></div>
                    </div>
                  </div>

                  <div className="border border-slate-300 dark:border-slate-700 p-3 rounded-lg flex flex-col justify-between">
                    <div>
                      <strong className="block mb-1 text-blue-600">Saran & Masukan Guru:</strong>
                      <p className="italic leading-relaxed text-[11px]">
                        "Pertahankan prestasi akademismu dan tetaplah rajin membantu sesama teman sekelas."
                      </p>
                    </div>
                    <div className="text-right text-[10px] font-bold text-emerald-500 mt-2">STATUS: NAIK KELAS</div>
                  </div>
                </div>

                {/* Indonesian Formal Signature stamp section */}
                <div className="flex justify-between text-xs mt-12">
                  <div className="text-center">
                    <p className="mb-1">Mengetahui,</p>
                    <p className="font-semibold">Orang Tua/Wali Murid</p>
                    <div className="h-16" />
                    <p className="border-b border-slate-400 w-36 mx-auto" />
                  </div>

                  <div className="text-center">
                    <p className="mb-1">Padang, {new Date(activePreview.uploadedAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="font-semibold">Guru Pengampu Kelas,</p>
                    <div className="h-8 flex justify-center items-center">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono border border-dashed border-emerald-500 px-2 py-0.5 rounded rotate-2 bg-emerald-50 dark:bg-emerald-950/20">
                        Signed: {activePreview.uploadedBy}
                      </span>
                    </div>
                    <div className="h-8" />
                    <p className="font-bold border-b border-slate-400 w-44 mx-auto">{activePreview.uploadedBy}</p>
                    <p className="text-[9px] text-slate-400">NIP Operator Sekolah</p>
                  </div>
                </div>

              </div>

              {/* Real PDF Embed container below mock sheet to ensure complete backup of raw uploads */}
              <div className="max-w-3xl mx-auto mt-6">
                <h4 className="font-bold text-xs mb-2 text-slate-400 uppercase tracking-wide">File Asli PDF Unggahan</h4>
                <div className="border rounded-xl overflow-hidden bg-slate-900 h-96 flex flex-col justify-between">
                  <iframe
                    src={activePreview.fileUrl}
                    className="w-full h-full border-0 bg-slate-800"
                    title="Original PDF Iframe viewer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 flex justify-end space-x-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <a
                href={activePreview.fileUrl}
                download={activePreview.fileName}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1"
              >
                <Download size={14} />
                <span>Unduh File Asli (PDF)</span>
              </a>
              <button
                onClick={() => setActivePreview(null)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors
                  ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
                `}
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
