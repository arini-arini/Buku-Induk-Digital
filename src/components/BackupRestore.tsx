import React, { useState } from "react";
import { Database, Download, Upload, AlertCircle, CheckCircle, RefreshCw, FileWarning } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

interface BackupRestoreProps {
  onBackup: () => Promise<any>;
  onRestore: (backupData: any) => Promise<void>;
  isDark: boolean;
}

export default function BackupRestore({ onBackup, onRestore, isDark }: BackupRestoreProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<any | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {}
  });

  const triggerNotif = (type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 5000);
  };

  // Generate a downloable JSON backup of the server DB
  const handleBackupClick = async () => {
    setLoading(true);
    try {
      const backupData = await onBackup();
      
      // Standard local file trigger
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Buku_Induk_SD_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      triggerNotif('success', "Berkas cadangan basis data (.json) berhasil dibuat dan diunduh.");
    } catch (err: any) {
      triggerNotif('error', err.message || "Gagal membuat cadangan basis data.");
    } finally {
      setLoading(false);
    }
  };

  // Upload/Read file restore JSON data
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.data || !parsed.data.users || !parsed.data.students) {
          triggerNotif('error', "Format berkas cadangan tidak valid (Data Buku Induk rusak atau tidak lengkap).");
          setFileContent(null);
          return;
        }
        setFileContent(parsed);
        triggerNotif('success', `Berkas cadangan "${file.name}" terbaca dengan sukses. Siap dipulihkan.`);
      } catch (err) {
        triggerNotif('error', "Gagal membaca berkas JSON. Pastikan berkas tidak rusak.");
        setFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreClick = async () => {
    if (!fileContent) return;
    setConfirmConfig({
      isOpen: true,
      title: "Konfirmasi Restore Data",
      message: "PERINGATAN! Pemulihan data (Restore) akan menghapus dan mengganti seluruh data yang ada saat ini (Siswa, Guru, Akun, Rapor) dengan data dari berkas cadangan.\n\nApakah Anda yakin ingin melanjutkan?",
      action: async () => {
        setLoading(true);
        try {
          await onRestore(fileContent);
          triggerNotif('success', "Sistem basis data Buku Induk berhasil dipulihkan secara penuh. Memuat ulang sistem...");
          setFileContent(null);
          setFileName("");
          
          // Reload system to apply restore changes
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (err: any) {
          triggerNotif('error', err.message || "Gagal memulihkan database.");
        } finally {
          setLoading(false);
          setConfirmConfig({ ...confirmConfig, isOpen: false });
        }
      }
    });
  };

  return (
    <div className={`p-6 rounded-2xl border
      ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
    `}>
      {/* Header section */}
      <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Database size={22} className="text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="font-bold text-lg">Backup & Restore Basis Data</h2>
          <p className="text-xs text-slate-500">Amankan rekam Buku Induk dengan mencadangkan data berkala atau memulihkan data jika terjadi kegagalan sistem.</p>
        </div>
      </div>

      {/* Notifications */}
      {notif && (
        <div className={`p-4 mb-6 rounded-xl flex items-start space-x-2 text-xs border animate-fadeIn
          ${notif.type === 'success' 
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300" 
            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300"}
        `}>
          {notif.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <p className="font-medium flex-1 leading-relaxed">{notif.msg}</p>
        </div>
      )}

      {/* Backup and Restore Cards Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card A: Create Backup */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between
          ${isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100"}
        `}>
          <div>
            <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center space-x-1">
              <Download size={16} />
              <span>Ekspor Backup Basis Data</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Mengunduh berkas lengkap berisi seluruh identitas siswa, data guru pengampu, rekam audit aktivitas, serta akun masuk dalam format aman JSON.
            </p>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              * Direkomendasikan melakukan ekspor cadangan data setiap akhir semester.
            </p>
          </div>

          <button
            onClick={handleBackupClick}
            disabled={loading}
            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/10 flex items-center justify-center space-x-1 cursor-pointer transition-all"
            id="btn-backup-trigger"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Cadangkan Sistem Sekarang</span>
          </button>
        </div>

        {/* Card B: Restore Backup */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between
          ${isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100"}
        `}>
          <div>
            <h3 className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
              <Upload size={16} />
              <span>Pulihkan Sistem (Restore)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Unggah berkas cadangan Buku Induk (.json) yang telah diekspor sebelumnya untuk memulihkan database secara keseluruhan.
            </p>
            
            {/* Warning badge */}
            <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-[10px] text-red-700 dark:text-red-300 flex items-start space-x-1.5 leading-relaxed">
              <FileWarning size={14} className="flex-shrink-0 mt-0.5" />
              <span><strong>PERINGATAN:</strong> Tindakan pemulihan ini bersifat destruktif dan akan menimpa seluruh entri basis data aktif di server.</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {/* File Input */}
            <label className={`w-full py-2 border-2 border-dashed rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors text-xs font-semibold
              ${isDark 
                ? "border-slate-700 hover:border-red-500 bg-slate-800/20 hover:bg-slate-800/50 text-slate-300" 
                : "border-slate-300 hover:border-red-600 bg-white hover:bg-slate-50 text-slate-600"}
            `}>
              <Upload size={14} className="text-red-500" />
              <span>{fileName ? `File: ${fileName}` : "Pilih File Cadangan (.json)"}</span>
              <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" disabled={loading} />
            </label>

            {/* Restore button */}
            <button
              onClick={handleRestoreClick}
              disabled={loading || !fileContent}
              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-500/10 flex items-center justify-center space-x-1 cursor-pointer disabled:cursor-not-allowed transition-all"
              id="btn-restore-trigger"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>Pulihkan Basis Data</span>
            </button>
          </div>
        </div>

      </div>
      
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.action}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
