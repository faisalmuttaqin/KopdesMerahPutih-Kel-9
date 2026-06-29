import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Member } from '../types';

interface LoginViewProps {
  onLoginSuccess: (member: Member) => void;
  members: Member[];
  onRegister: (member: Member) => void;
}

export default function LoginView({ onLoginSuccess, members, onRegister }: LoginViewProps) {
  const coopName = localStorage.getItem('kopdes_coop_name') || 'Koperasi Desa Merah Putih';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInitialBalance, setRegInitialBalance] = useState(500000);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Username tidak boleh kosong');
      return;
    }

    const matchedUser = members.find(
      (m) => m.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (matchedUser) {
      // Check if password matches. Fallback to username for legacy mock accounts.
      const correctPassword = matchedUser.password || matchedUser.username;
      if (password !== correctPassword) {
        setErrorMsg('Password yang Anda masukkan salah. Silakan coba lagi.');
        return;
      }
      onLoginSuccess(matchedUser);
    } else {
      setErrorMsg('Username tidak ditemukan. Coba ketik "admin" atau "budi"');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setRegError('Semua field wajib diisi');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password minimal harus 4 karakter');
      return;
    }

    // Check if username is already taken
    const usernameExists = members.some(
      (m) => m.username.toLowerCase() === regUsername.trim().toLowerCase()
    );
    if (usernameExists) {
      setRegError('Username sudah digunakan oleh anggota lain. Silakan pilih username lain.');
      return;
    }

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: regName.trim(),
      username: regUsername.trim().toLowerCase(),
      initials: regName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      role: 'member',
      balance: regInitialBalance,
      activeLoan: 0,
      password: regPassword.trim(),
    };

    onRegister(newMember);

    setRegSuccess('Pendaftaran berhasil! Akun Anda siap digunakan.');
    
    // Clear registration fields
    setRegName('');
    setRegUsername('');
    setRegPassword('');
    
    // Auto-prefill the login fields for an elegant, frictionless login
    setUsername(newMember.username);
    setPassword(newMember.password || '');
    
    setTimeout(() => {
      setIsRegisterOpen(false);
      setRegSuccess('');
    }, 2000);
  };

  const handleQuickLogin = (role: 'admin' | 'budi') => {
    const matchedUser = members.find((m) => m.id === role);
    if (matchedUser) {
      onLoginSuccess(matchedUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex flex-col items-center justify-center p-4 text-[#1b1b24] font-sans antialiased">
      {/* Login Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Main Card */}
        <div className="neumorphic-flat-gray rounded-[40px] p-8 md:p-10 flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-20 h-20 neumorphic-flat-gray rounded-full flex items-center justify-center mb-4 overflow-hidden bg-white/20">
              <img
                alt="Koperasi Modern Logo"
                className="w-14 h-14 object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBesQ7DtURo8RyQyK3Vp8Jral0gKBi9uc5m1kZD5l6JrU9tdsamqGxe-QmA53WlSCyzR2p5bCh120hrE5ZCRoawDJXekGphDQR8tPYNHEGjjuLUTYBMMxrtL-hcTpI7ZZOXv_wEZzZHmivoednfrZBp24L1uCfWsJoREfuN24z5e8Rgb6rnOMLOWzTNBTGN7zWrJQw2c2WR4esxlwsI1jV0-juXxlz0p2cSAA1a2s1J7K9iK6jFvD_zKoitSNZaVEMOfB1sH_MQkI4"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-red-600 font-headline-md mb-1 text-center">
              {coopName}
            </h1>
            <p className="text-xs font-semibold text-[#787587] tracking-widest uppercase text-center">
              Community & Growth
            </p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-[#1b1b24]">
              Selamat Datang di Portal Koperasi
            </h2>
            <p className="text-sm text-[#474555] mt-1">
              Masuk ke Sistem Manajemen Koperasi
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="w-full mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Username Field */}
            <div className="space-y-1">
              <label
                className="text-xs md:text-sm font-medium text-[#474555] ml-2"
                htmlFor="username"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#787587]">
                    person
                  </span>
                </div>
                <input
                  className="neumorphic-inset-gray w-full pl-12 pr-4 py-3 md:py-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-red-600/20 text-[#1b1b24] placeholder-[#787587]/50 transition-all font-sans"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Masukkan username Anda (admin/budi)"
                  type="text"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label
                className="text-xs md:text-sm font-medium text-[#474555] ml-2"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#787587]">
                    lock
                  </span>
                </div>
                <input
                  className="neumorphic-inset-gray w-full pl-12 pr-12 py-3 md:py-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-red-600/20 text-[#1b1b24] placeholder-[#787587]/50 transition-all font-sans"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  className="absolute inset-y-0 right-4 flex items-center text-[#787587] hover:text-red-600 transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined select-none text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between px-2 pt-1 text-xs md:text-sm">
              <label
                className="flex items-center cursor-pointer group"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className="relative">
                  <div className="neumorphic-inset-gray w-5 h-5 rounded-md flex items-center justify-center transition-all group-active:scale-95">
                    {rememberMe && (
                      <span className="material-symbols-outlined text-xs text-red-600 font-bold">
                        check
                      </span>
                    )}
                  </div>
                </div>
                <span className="ml-2 text-[#474555] select-none font-medium">
                  Ingat Saya
                </span>
              </label>
              <button
                type="button"
                className="text-red-600 hover:underline transition-all select-none font-semibold"
                onClick={() => alert('Fitur pemulihan sandi dikonfigurasi secara internal.')}
              >
                Lupa Password?
              </button>
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <button
                className="neumorphic-button-primary-gray w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 group cursor-pointer"
                type="submit"
              >
                <span>Masuk</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  login
                </span>
              </button>
            </div>
          </form>

          {/* Quick Login Section (Extremely useful for testing/simulation) */}
          <div className="w-full mt-6 pt-5 border-t border-white/20">
            <p className="text-center text-xs text-[#787587] uppercase tracking-wider font-semibold mb-3">
              Uji Coba Cepat (Pilih Akses)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="neumorphic-button-gray py-2.5 px-3 rounded-xl text-xs font-semibold text-red-600 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">shield_person</span>
                Admin Utama
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('budi')}
                className="neumorphic-button-gray py-2.5 px-3 rounded-xl text-xs font-semibold text-[#006d3c] hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Budi (Anggota)
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <p className="text-xs md:text-sm text-[#474555]">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="text-red-600 font-bold hover:underline ml-1 cursor-pointer"
              >
                Daftar Anggota Baru
              </button>
            </p>
          </div>
        </div>

        {/* Secondary Info (Outside Card) */}
        <div className="mt-6 flex justify-center gap-6 opacity-60 hover:opacity-100 transition-opacity text-xs text-[#787587]">
          <button
            type="button"
            className="hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
            onClick={() => alert('Pusat bantuan: hubungi kami di support@kopdesmp.id')}
          >
            <span className="material-symbols-outlined text-sm">help</span> Bantuan
          </button>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">language</span> Bahasa Indonesia
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">verified_user</span> Keamanan
          </div>
        </div>
      </motion.div>

      {/* MODAL: REGISTER NEW MEMBER */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-[#E0E5EC]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md neumorphic-flat-gray rounded-[40px] p-8 space-y-6 my-8"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#a3b1c6]/30">
              <h3 className="text-base font-bold text-red-600 font-headline-md flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">person_add</span>
                Pendaftaran Anggota Baru
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterOpen(false);
                  setRegError('');
                  setRegSuccess('');
                }}
                className="material-symbols-outlined text-[#787587] hover:text-[#1b1b24] cursor-pointer bg-transparent border-none p-1"
              >
                close
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-red-105 text-red-700 text-xs rounded-xl text-center font-medium border border-red-200">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-medium">
                {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#474555] ml-2">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  className="neumorphic-inset-gray w-full px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-red-600/20 text-[#1b1b24] placeholder-[#787587]/50"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#474555] ml-2">Username Baru</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: andik"
                  className="neumorphic-inset-gray w-full px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-red-600/20 text-[#1b1b24] placeholder-[#787587]/50"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#474555] ml-2">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 4 karakter"
                    className="neumorphic-inset-gray w-full pl-4 pr-12 py-3 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-red-600/20 text-[#1b1b24] placeholder-[#787587]/50"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <button
                    className="absolute inset-y-0 right-4 flex items-center text-[#787587] hover:text-red-600 transition-colors bg-transparent border-none"
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    <span className="material-symbols-outlined select-none text-xl">
                      {showRegPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#474555] ml-2">Setoran Simpanan Awal (Rp)</label>
                <input
                  type="number"
                  required
                  min="500000"
                  step="50000"
                  className="neumorphic-inset-gray w-full px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-red-600/20 text-[#1b1b24]"
                  value={regInitialBalance}
                  onChange={(e) => setRegInitialBalance(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] text-[#787587] font-medium ml-2 block leading-none mt-1">Minimal Setoran Rp 500.000 untuk simpanan awal sukarela</span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="neumorphic-button-gray flex-1 py-3.5 rounded-2xl font-bold text-xs cursor-pointer border-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="neumorphic-button-primary-gray flex-1 py-3.5 rounded-2xl font-extrabold text-xs cursor-pointer border-none"
                >
                  Daftarkan Akun
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
