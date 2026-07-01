import React, { useState } from "react";
import { UserCheck, Plus, Pencil, Trash2, Key, Search, User, Award, CheckCircle, AlertCircle, X, RefreshCw } from "lucide-react";
import { Teacher } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";

interface TeacherManagerProps {
  teachers: Teacher[];
  onCreate: (t: Omit<Teacher, "id" | "username">) => Promise<void>;
  onUpdate: (id: string, t: Partial<Teacher>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onResetPassword: (id: string) => Promise<string>;
  isDark: boolean;
}

export default function TeacherManager({
  teachers,
  onCreate,
  onUpdate,
  onDelete,
  onResetPassword,
  isDark,
}: TeacherManagerProps) {
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  // Form states
  const [nip, setNip] = useState<string>("");
  const [nama, setNama] = useState<string>("");
  const [kelasDiampu, setKelasDiampu] = useState<string>("1-A");

  // Filter list
  const filteredTeachers = teachers.filter(t =>
    t.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.nip.includes(search) ||
    t.kelasDiampu.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingTeacher(null);
    setNip("");
    setNama("");
    setKelasDiampu("1-A");
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setNip(t.nip);
    setNama(t.nama);
    setKelasDiampu(t.kelasDiampu);
    setIsModalOpen(true);
  };

  const triggerNotif = (type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip || !nama || !kelasDiampu) {
      triggerNotif('error', "Mohon lengkapi NIP, Nama, dan Kelas Diampu.");
      return;
    }

    setLoading(true);
    try {
      if (editingTeacher) {
        await onUpdate(editingTeacher.id, { nip, nama, kelasDiampu });
        triggerNotif('success', `Berhasil memperbarui data guru ${nama}.`);
      } else {
        await onCreate({ nip, nama, kelasDiampu });
        triggerNotif('success', `Berhasil mendaftarkan guru baru ${nama}. Akun masuk dibuat otomatis dengan nama pengguna NIP.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      triggerNotif('error', err.message || "Gagal menyimpan data guru.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (t: Teacher) => {
    setConfirmConfig({
      isOpen: true,
      title: "Konfirmasi Hapus Guru",
      message: `Apakah Anda yakin ingin menghapus guru ${t.nama}?\nSemua akun terkait akan ikut terhapus.`,
      action: async () => {
        try {
          await onDelete(t.id);
          triggerNotif('success', `Berhasil menghapus guru ${t.nama}.`);
        } catch (err: any) {
          triggerNotif('error', err.message || "Gagal menghapus guru.");
        }
        setConfirmConfig({ ...confirmConfig, isOpen: false });
      }
    });
  };

  const handleReset = async (t: Teacher) => {
    setConfirmConfig({
      isOpen: true,
      title: "Konfirmasi Reset Password",
      message: `Konfirmasi reset kata sandi untuk guru ${t.nama}?\nKata sandi akan dikembalikan ke standar bawaan: NIP123`,
      action: async () => {
        try {
          const msg = await onResetPassword(t.id);
          triggerNotif('success', msg);
        } catch (err: any) {
          triggerNotif('error', err.message || "Gagal mereset kata sandi.");
        }
        setConfirmConfig({ ...confirmConfig, isOpen: false });
      }
    });
  };

  return (
    <div className={`p-6 rounded-2xl border
      ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
    `}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <UserCheck size={22} className="text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="font-bold text-lg">Manajemen Guru Pengampu</h2>
            <p className="text-xs text-slate-500">Kelola guru, tentukan kelas yang diampu, dan atur akun kredensial guru pengampu.</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          id="btn-add-teacher"
        >
          <Plus size={14} />
          <span>Tambah Guru</span>
        </button>
      </div>

      {/* Notifications */}
      {notif && (
        <div className={`p-4 mb-4 rounded-xl flex items-start space-x-2 text-xs border animate-fadeIn
          ${notif.type === 'success' 
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300" 
            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300"}
        `}>
          {notif.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <p className="font-medium flex-1 leading-relaxed">{notif.msg}</p>
        </div>
      )}

      {/* Toolbar Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari guru berdasarkan nama, NIP, kelas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
            ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400 text-slate-800"}
          `}
          id="teacher-search-input"
        />
      </div>

      {/* Teachers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-400 text-xs">
            <User size={30} className="mx-auto mb-2 text-slate-300" />
            Tidak ada guru yang terdaftar.
          </div>
        ) : (
          filteredTeachers.map((t) => (
            <div 
              key={t.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md
                ${isDark ? "bg-slate-800/40 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-100 hover:border-slate-200"}
              `}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 uppercase">
                      {t.nama.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{t.nama}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">NIP: {t.nip}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    Kelas {t.kelasDiampu}
                  </span>
                </div>

                <div className={`mt-3 pt-3 border-t text-[11px] space-y-1 ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                  <div className="flex justify-between">
                    <span>Nama Pengguna Login:</span>
                    <strong className="font-mono text-[10px] text-blue-500">{t.nip}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status Hak Akses:</span>
                    <strong className="text-emerald-500">Guru Pengampu</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleReset(t)}
                  className={`p-1.5 rounded-lg border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500`}
                  title="Reset Password Guru (ke default)"
                >
                  <Key size={14} />
                </button>
                <button
                  onClick={() => openEditModal(t)}
                  className={`p-1.5 rounded-lg border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500`}
                  title="Ubah Data Guru"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className={`p-1.5 rounded-lg border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500`}
                  title="Hapus Data Guru"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form 
            onSubmit={handleSubmit}
            className={`w-full max-w-md rounded-2xl border overflow-hidden shadow-xl transition-all
              ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}
            `}
          >
            {/* Modal Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center space-x-1.5">
                <UserCheck size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm">
                  {editingTeacher ? "Ubah Data Guru" : "Daftarkan Guru Baru"}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* NIP */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  NIP (Nomor Induk Pegawai) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 198503122010011003"
                  value={nip}
                  onChange={(e) => setNip(e.target.value.replace(/[^0-9]/g, ""))}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                    ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                  `}
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">NIP akan digunakan sebagai nama pengguna login guru.</span>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nama Lengkap Guru (Beserta Gelar) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahma, S.Pd."
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                    ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                  `}
                />
              </div>

              {/* Kelas yang diampu */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Kelas yang Diampu *
                </label>
                <select
                  required
                  value={kelasDiampu}
                  onChange={(e) => setKelasDiampu(e.target.value)}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                    ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}
                  `}
                >
                  <option value="1-A">Kelas 1-A</option>
                  <option value="1-B">Kelas 1-B</option>
                  <option value="2-A">Kelas 2-A</option>
                  <option value="2-B">Kelas 2-B</option>
                  <option value="3-A">Kelas 3-A</option>
                  <option value="3-B">Kelas 3-B</option>
                  <option value="4-A">Kelas 4-A</option>
                  <option value="4-B">Kelas 4-B</option>
                  <option value="5-A">Kelas 5-A</option>
                  <option value="5-B">Kelas 5-B</option>
                  <option value="6-A">Kelas 6-A</option>
                  <option value="6-B">Kelas 6-B</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 flex justify-end space-x-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                <span>Simpan</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
