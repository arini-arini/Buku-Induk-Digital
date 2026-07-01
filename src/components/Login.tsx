import React, { useState } from "react";
import { GraduationCap, ShieldAlert, Lock, User, RefreshCw, Eye, EyeOff, Sparkles, LogIn } from "lucide-react";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isDark: boolean;
}

export default function Login({ onLogin, isDark }: LoginProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const presets = [
    {
      role: "Admin Operator",
      user: "admin",
      pass: "admin123",
      desc: "Kelola Master Data & Sistem",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      role: "Guru Pengampu",
      user: "198503122010011003",
      pass: "guru123",
      desc: "Kelola Rapor Kelas 1-A",
      color: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      role: "Siswa Mandiri",
      user: "0145239201",
      pass: "siswa123",
      desc: "Lihat Rapor Ahmad Fauzi",
      color: "bg-amber-600 hover:bg-amber-700"
    }
  ];

  const handlePresetSelect = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Nama pengguna dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onLogin(username.trim(), password);
    } catch (err: any) {
      setError(err.message || "Nama pengguna atau kata sandi Anda salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300
      ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}
    `}>
      {/* Decorative ambient vector glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left column: Brand promotion Card */}
        <div className={`lg:col-span-5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl border text-white
          ${isDark 
            ? "bg-slate-900 border-slate-800" 
            : "bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-800 border-blue-600"}
        `}>
          {/* Abstract circles */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 pointer-events-none" />

          <div className="space-y-6">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <GraduationCap size={28} className="text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-widest leading-none">BUKU INDUK</h1>
                <span className="text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">Sistem Informasi SD</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-black leading-tight uppercase tracking-tight">SD NEGERI 37 SUNGAI BANGEK</h2>
              <p className="text-xs text-blue-100 leading-relaxed font-medium">
                Sistem pencatatan otentik Buku Induk murid sekolah dasar yang modern, akuntabel, aman, dan mudah dioperasikan secara kolaboratif oleh operator, guru, dan wali murid.
              </p>
            </div>
          </div>

          <div className="pt-12 border-t border-white/10 mt-12 space-y-4">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="text-amber-400 flex-shrink-0" size={16} />
              <span className="text-[11px] font-bold text-slate-100">Dukungan Multi-Hak Akses Kredensial (RBAC)</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(p.user, p.pass)}
                  className="w-full p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-left flex items-center justify-between group cursor-pointer"
                  id={`preset-${p.user}`}
                >
                  <div className="truncate pr-2">
                    <span className="text-[10px] font-black tracking-wide uppercase text-emerald-300 block">{p.role}</span>
                    <span className="text-[10px] text-blue-100 block truncate">{p.desc}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-white/10 text-[9px] font-bold tracking-wider uppercase font-mono group-hover:bg-blue-500">
                    Pilih
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Login form Panel */}
        <div className={`lg:col-span-7 rounded-3xl p-8 flex flex-col justify-center shadow-2xl border
          ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
        `}>
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-blue-600 dark:text-blue-400">Masuk Aplikasi</h2>
              <p className="text-xs text-slate-400 mt-1">Masukkan nama pengguna dan kata sandi yang terdaftar di sekolah Anda.</p>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2 animate-fadeIn">
                <ShieldAlert className="flex-shrink-0 mt-0.5" size={16} />
                <span className="font-semibold leading-relaxed flex-1">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nama Pengguna (Username / NIP / NISN)
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan NIP guru atau NISN murid..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                      ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"}
                    `}
                    id="login-username-input"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Kata Sandi (Password)
                  </label>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={`w-full pl-10 pr-12 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                      ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"}
                    `}
                    id="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors"
                    title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-2xl shadow-md shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center space-x-1"
                id="btn-login-submit"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <LogIn size={14} />}
                <span>{loading ? "Menandatangani Sesi..." : "Masuk ke Sistem"}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
