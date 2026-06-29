import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Member, LoanApplication, RecentActivity } from '../types';

interface LoanApplicationViewProps {
  currentUser: Member;
  loans: LoanApplication[];
  activities: RecentActivity[];
  onBackToDashboard: () => void;
  onUpdateDatabase: (updatedData: {
    loans?: LoanApplication[];
    activities?: RecentActivity[];
  }) => void;
}

export default function LoanApplicationView({
  currentUser,
  loans,
  activities,
  onBackToDashboard,
  onUpdateDatabase,
}: LoanApplicationViewProps) {
  const coopName = localStorage.getItem('kopdes_coop_name') || 'Koperasi Desa Merah Putih';
  const interestRate = parseFloat(localStorage.getItem('kopdes_interest_rate') || '1.5');
  const dailyInterestRate = parseFloat(localStorage.getItem('kopdes_daily_interest_rate') || '0.05');
  const maxLoanLimit = parseInt(localStorage.getItem('kopdes_max_loan_limit') || '50000000');

  const [nominal, setNominal] = useState<number>(10000000);
  const [tenor, setTenor] = useState<number>(12);
  const [tenorUnit, setTenorUnit] = useState<'bulan' | 'hari'>('bulan');
  const [purpose, setPurpose] = useState<string>('Modal Usaha');
  const [loanDate, setLoanDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter loans for the current user to check if they have any active or pending loan
  const userLoans = loans.filter((l) => l && l.memberId === currentUser.id);
  let activeLoan = userLoans.find(
    (l) => l && (l.status === 'pending' || l.status === 'approved') && (l.paidMonths || 0) < l.tenor
  );

  // Fallback if user's member profile says they have an active loan, but we didn't find the exact object in list
  if (!activeLoan && currentUser.activeLoan && currentUser.activeLoan > 0) {
    activeLoan = {
      id: 'fallback-active',
      memberId: currentUser.id,
      memberName: currentUser.name,
      memberInitials: currentUser.initials,
      amount: currentUser.activeLoan,
      tenor: 12,
      purpose: 'Pinjaman Koperasi',
      date: new Date().toISOString(),
      status: 'approved',
      monthlyInstallment: Math.round(currentUser.activeLoan / 12),
      totalRepayment: currentUser.activeLoan,
      totalInterest: 0,
      paidMonths: 0
    };
  }

  const hasActiveLoan = !!activeLoan;

  // Calculation states
  const [pokokPerBulan, setPokokPerBulan] = useState(0);
  const [bungaPerBulan, setBungaPerBulan] = useState(0);
  const [cicilanPerBulan, setCicilanPerBulan] = useState(0);
  const [totalBayar, setTotalBayar] = useState(0);
  const [totalBunga, setTotalBunga] = useState(0);

  // Calculate whenever inputs mutate
  useEffect(() => {
    const calculatedNominal = nominal || 0;
    const calculatedTenor = tenor || 1;
    const flatBungaRate = interestRate / 100;
    const calculatedDailyBungaRate = dailyInterestRate / 100;

    let bunga = 0;
    let pokok = 0;
    let cicilan = 0;
    let total = 0;
    let tBunga = 0;

    if (tenorUnit === 'bulan') {
      bunga = calculatedNominal * flatBungaRate;
      pokok = calculatedNominal / calculatedTenor;
      cicilan = pokok + bunga;
      total = cicilan * calculatedTenor;
      tBunga = bunga * calculatedTenor;
    } else {
      // tenorUnit === 'hari'
      bunga = calculatedNominal * calculatedDailyBungaRate * calculatedTenor;
      pokok = calculatedNominal / calculatedTenor;
      cicilan = pokok + (calculatedNominal * calculatedDailyBungaRate);
      total = cicilan * calculatedTenor;
      tBunga = bunga;
    }

    setPokokPerBulan(Math.round(pokok));
    setBungaPerBulan(Math.round(bunga));
    setCicilanPerBulan(Math.round(cicilan));
    setTotalBayar(Math.round(total));
    setTotalBunga(Math.round(tBunga));
  }, [nominal, tenor, tenorUnit, interestRate, dailyInterestRate]);

  // Format currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Generate projection chart data
  const projectionData = Array.from({ length: (tenor || 12) + 1 }).map((_, i) => {
    const sisaPokok = Math.max(0, (nominal || 0) - Math.round(((nominal || 0) / (tenor || 12)) * i));
    const totalTerbayar = Math.round((cicilanPerBulan || 0) * i);
    return {
      name: tenorUnit === 'bulan' ? `Bln ${i}` : `Hari ${i}`,
      'Sisa Pokok': sisaPokok,
      'Total Terbayar': totalTerbayar,
    };
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasActiveLoan) {
      alert('Maaf, Anda tidak dapat mengajukan pinjaman baru karena masih memiliki pengajuan tertunda atau tagihan pinjaman berjalan yang belum lunas.');
      return;
    }
    if (nominal <= 500000) {
      alert('Nominal pinjaman minimal adalah Rp 500.000');
      return;
    }
    if (nominal > maxLoanLimit) {
      alert(`Maaf, batas maksimal pinjaman adalah ${formatRupiah(maxLoanLimit)}.`);
      return;
    }

    if (tenorUnit === 'bulan') {
      const allowedTenors = [1, 3, 6, 9, 12];
      if (!allowedTenors.includes(tenor)) {
        alert('Tenor pilihan bulan hanya diperbolehkan: 1, 3, 6, 9, atau 12 bulan.');
        return;
      }
    } else {
      if (tenor <= 0 || tenor > 32) {
        alert('Tenor pilihan hari maksimal adalah 32 hari.');
        return;
      }
    }

    const newLoan: LoanApplication = {
      id: `loan-${Date.now()}`,
      memberId: currentUser.id,
      memberName: currentUser.name,
      memberInitials: currentUser.initials,
      amount: nominal,
      tenor: tenor,
      tenorUnit: tenorUnit,
      purpose: purpose,
      date: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(loanDate)),
      status: 'pending',
      monthlyInstallment: cicilanPerBulan,
      totalRepayment: totalBayar,
      totalInterest: totalBunga,
      paidMonths: 0,
    };

    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'loan_submit',
      title: 'Pengajuan Pinjaman Baru',
      description: `${currentUser.name} mengajukan pinjaman sebesar ${formatRupiah(nominal)} untuk ${purpose}.`,
      time: 'Baru saja',
      color: 'text-[#e63b2e]',
      icon: 'add_circle',
      timestamp: new Date().toISOString(),
    };

    const updatedLoans = [newLoan, ...loans];
    const updatedActivities = [newActivity, ...activities];

    onUpdateDatabase({
      loans: updatedLoans,
      activities: updatedActivities,
    });

    alert(
      `Pengajuan kredit sebesar ${formatRupiah(nominal)} berhasil diajukan dengan sukses! Silakan hubungi fungsionaris Admin Utama untuk meninjau status persetujuan.`
    );
    onBackToDashboard();
  };

  return (
    <div className="min-h-screen bg-[#fcf8ff] text-[#1b1b24] font-sans antialiased flex flex-col md:flex-row">
      {/* Side Navigation Shell */}
      <aside className="w-64 bg-[#fcf8ff] shadow-[6px_6px_12px_#A3B1C6] flex flex-col py-6 sticky top-0 shrink-0 hidden md:flex h-screen">
        <div className="px-6 mb-8">
          <img
            alt="Koperasi Desa Merah Putih Logo"
            className="h-12 w-auto mb-2"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBesQ7DtURo8RyQyK3Vp8Jral0gKBi9uc5m1kZD5l6JrU9tdsamqGxe-QmA53WlSCyzR2p5bCh120hrE5ZCRoawDJXekGphDQR8tPYNHEGjjuLUTYBMMxrtL-hcTpI7ZZOXv_wEZzZHmivoednfrZBp24L1uCfWsJoREfuN24z5e8Rgb6rnOMLOWzTNBTGN7zWrJQw2c2WR4esxlwsI1jV0-juXxlz0p2cSAA1a2s1J7K9iK6jFvD_zKoitSNZaVEMOfB1sH_MQkI4"
          />
          <p className="text-xs font-semibold text-[#474555]/80 tracking-widest uppercase">
            Management Portal
          </p>
        </div>

        <nav className="flex-grow px-2 space-y-1">
          <button
            onClick={onBackToDashboard}
            className="w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 text-[#474555] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#A3B1C6] hover:text-primary transition-all text-sm"
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {}}
            className="bg-background shadow-[inset_4px_4px_8px_#A3B1C6,inset_-4px_-4px_8px_#FFFFFF] text-primary font-bold rounded-xl m-2 flex items-center px-4 py-3 text-sm scale-95"
          >
            <span className="material-symbols-outlined mr-3">account_balance</span>
            <span>Loans (Calculator)</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-[#c8c4d8]/40 pt-4 px-2 space-y-1">
          <button
            onClick={() => alert(`Panduan Pinjaman: Bunga flat ${interestRate}% dwi-bulanan.`)}
            className="w-full text-left text-[#474555] font-semibold rounded-xl flex items-center px-4 py-2.5 hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#A3B1C6] hover:text-primary transition-all text-xs"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            <span>Help System</span>
          </button>

          <button
            onClick={onBackToDashboard}
            className="w-full text-left text-neutral-600 font-bold rounded-xl flex items-center px-4 py-2.5 hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#A3B1C6] hover:bg-neutral-50 transition-all text-xs"
          >
            <span className="material-symbols-outlined mr-3">arrow_back</span>
            <span>Kembali</span>
          </button>
        </div>
      </aside>

      {/* Main Content Form area */}
      <main className="flex-grow p-8">
        {/* Back Link Mobile view */}
        <button
          onClick={onBackToDashboard}
          className="md:hidden text-primary text-xs font-bold flex items-center gap-1 mb-4"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Kembali ke Dashboard
        </button>

        <header className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold">Ajukan Pinjaman Baru</h2>
          <p className="text-xs md:text-sm text-[#474555] mt-1">
            Lengkapi detail pengajuan pinjaman koperasi Anda di bawah ini.
          </p>
        </header>

        {hasActiveLoan && activeLoan && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-3 bg-red-100 rounded-2xl text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">gavel</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                Akses Pengajuan Pinjaman Baru Terkunci
              </h4>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {activeLoan.status === 'pending' ? (
                  <>
                    Anda memiliki <strong>Pengajuan Pinjaman Baru</strong> sebesar <strong>Rp {new Intl.NumberFormat('id-ID').format(activeLoan.amount)}</strong> yang berstatus <strong>PENDING</strong> (Menunggu persetujuan fungsionaris Admin). Anda tidak dapat mengajukan pinjaman baru sebelum status pengajuan ini disetujui atau ditolak.
                  </>
                ) : (
                  <>
                    Anda masih memiliki <strong>Pinjaman Aktif Berjalan</strong> sebesar <strong>Rp {new Intl.NumberFormat('id-ID').format(activeLoan.amount)}</strong> ({activeLoan.purpose}) yang belum dilunasi sepenuhnya. Anda baru mengangsur <strong>{activeLoan.paidMonths || 0} dari {activeLoan.tenor} bulan</strong>. Silakan lunasi sisa <strong>{activeLoan.tenor - (activeLoan.paidMonths || 0)} bulan</strong> tagihan Anda terlebih dahulu melalui tab Angsuran di Dashboard.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2.5 bg-primary hover:bg-[#a31d22] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm border-none"
            >
              Bayar Angsuran / Kembali
            </button>
          </div>
        )}

        {/* 2-column Grid split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Area: Form and Slider */}
          <div className="lg:col-span-7 space-y-6">
            <div className="neumorphic-flat rounded-2xl p-6 md:p-8">
              <form onSubmit={handleApplySubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-semibold text-[#474555] px-1" htmlFor="nominal">
                    Nominal Pinjaman (Rp)
                  </label>
                  <div className={`neumorphic-inset rounded-xl p-1.5 flex items-center h-12 transition-colors ${hasActiveLoan ? 'bg-neutral-100/70 opacity-60' : 'bg-[#fcf8ff]'}`}>
                    <span className="material-symbols-outlined ml-3 text-[#787587]">payments</span>
                    <input
                      className={`w-full bg-transparent border-none outline-none focus:ring-0 px-3 text-sm font-bold ${hasActiveLoan ? 'cursor-not-allowed text-neutral-400' : ''}`}
                      id="nominal"
                      placeholder="Contoh: 10000000"
                      type="number"
                      disabled={hasActiveLoan}
                      value={nominal || ''}
                      onChange={(e) => setNominal(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs md:text-sm font-semibold text-[#474555] px-1">
                      Satuan Tenor
                    </label>
                    <div className={`neumorphic-inset rounded-xl p-1 flex items-center h-12 ${hasActiveLoan ? 'bg-neutral-100/70 opacity-60' : 'bg-[#fcf8ff]'}`}>
                      <button
                        type="button"
                        disabled={hasActiveLoan}
                        onClick={() => {
                          setTenorUnit('bulan');
                          setTenor(12);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
                          tenorUnit === 'bulan'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-[#787587] hover:bg-neutral-100 bg-transparent'
                        }`}
                      >
                        Bulan
                      </button>
                      <button
                        type="button"
                        disabled={hasActiveLoan}
                        onClick={() => {
                          setTenorUnit('hari');
                          setTenor(30);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
                          tenorUnit === 'hari'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-[#787587] hover:bg-neutral-100 bg-transparent'
                        }`}
                      >
                        Hari
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs md:text-sm font-semibold text-[#474555] px-1" htmlFor="tenor">
                      Tenor ({tenorUnit === 'bulan' ? 'Bulan' : 'Hari'})
                    </label>
                    <div className={`neumorphic-inset rounded-xl p-1.5 flex items-center h-12 transition-colors ${hasActiveLoan ? 'bg-neutral-100/70 opacity-60' : 'bg-[#fcf8ff]'}`}>
                      <span className="material-symbols-outlined ml-3 text-[#787587]">calendar_today</span>
                      {tenorUnit === 'bulan' ? (
                        <select
                          className={`w-full bg-transparent border-none outline-none focus:ring-0 px-3 text-sm font-bold ${hasActiveLoan ? 'cursor-not-allowed text-neutral-400' : 'cursor-pointer'}`}
                          id="tenor"
                          disabled={hasActiveLoan}
                          value={tenor}
                          onChange={(e) => setTenor(parseInt(e.target.value) || 12)}
                        >
                          <option value="1">1 Bulan</option>
                          <option value="3">3 Bulan</option>
                          <option value="6">6 Bulan</option>
                          <option value="9">9 Bulan</option>
                          <option value="12">12 Bulan</option>
                        </select>
                      ) : (
                        <input
                          className={`w-full bg-transparent border-none outline-none focus:ring-0 px-3 text-sm font-bold ${hasActiveLoan ? 'cursor-not-allowed text-neutral-400' : ''}`}
                          id="tenor"
                          placeholder="Maks 32 hari"
                          type="number"
                          min="1"
                          max="32"
                          disabled={hasActiveLoan}
                          value={tenor || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTenor(val > 32 ? 32 : val);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-semibold text-[#474555] px-1" htmlFor="loan-date">
                    Tanggal Pengajuan Pinjaman
                  </label>
                  <div className={`neumorphic-inset rounded-xl p-1.5 flex items-center h-12 transition-colors ${hasActiveLoan ? 'bg-neutral-100/70 opacity-60' : 'bg-[#fcf8ff]'}`}>
                    <span className="material-symbols-outlined ml-3 text-[#787587]">event</span>
                    <input
                      className={`w-full bg-transparent border-none outline-none focus:ring-0 px-3 text-sm font-bold ${hasActiveLoan ? 'cursor-not-allowed text-neutral-400' : ''}`}
                      id="loan-date"
                      type="date"
                      required
                      disabled={hasActiveLoan}
                      value={loanDate}
                      onChange={(e) => setLoanDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs md:text-sm font-semibold text-[#474555] px-1">
                    Tujuan Pinjaman
                  </label>
                  <div className={`neumorphic-inset rounded-xl p-1.5 flex items-center h-12 transition-colors ${hasActiveLoan ? 'bg-neutral-100/70 opacity-60' : 'bg-[#fcf8ff]'}`}>
                    <span className="material-symbols-outlined ml-3 text-[#787587]">info</span>
                    <select
                      className={`w-full bg-transparent border-none outline-none focus:ring-0 px-3 text-sm font-semibold select-none cursor-pointer ${hasActiveLoan ? 'cursor-not-allowed text-neutral-400' : ''}`}
                      value={purpose}
                      disabled={hasActiveLoan}
                      onChange={(e) => setPurpose(e.target.value)}
                    >
                      <option value="Modal Usaha">Modal Usaha</option>
                      <option value="Pendidikan">Pendidikan</option>
                      <option value="Kebutuhan Darurat">Kebutuhan Darurat</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            {/* Calculations Visualization */}
            <div className="neumorphic-flat rounded-2xl p-6 md:p-8">
              <h3 className="text-xs md:text-sm font-bold mb-5 flex items-center text-primary">
                <span className="material-symbols-outlined mr-2">analytics</span> Visualisasi Kalkulasi
              </h3>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1.5 font-bold">
                    <span>Persentase Bunga (Flat)</span>
                    <span className="text-primary">{tenorUnit === 'bulan' ? `${interestRate}% / Bulan` : `${dailyInterestRate}% / Hari`}</span>
                  </div>
                  <div className="neumorphic-inset h-3 rounded-full overflow-hidden p-0.5 bg-neutral-200">
                    <div
                      className="bg-gradient-to-r from-primary to-[#ff4d4d] h-full rounded-full transition-all duration-300"
                      style={{ width: tenorUnit === 'bulan' ? '45%' : '15%' }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="neumorphic-inset p-4 rounded-xl text-center bg-[#fcf8ff]">
                    <p className="text-[10px] uppercase font-bold text-[#474555]">Angsuran Pokok / {tenorUnit === 'bulan' ? 'Bln' : 'Hari'}</p>
                    <p className="font-extrabold text-primary text-sm md:text-base mt-1">
                      {formatRupiah(pokokPerBulan)}
                    </p>
                  </div>
                  <div className="neumorphic-inset p-4 rounded-xl text-center bg-[#fcf8ff]">
                    <p className="text-[10px] uppercase font-bold text-[#474555]">Angsuran Bunga / {tenorUnit === 'bulan' ? 'Bln' : 'Hari'}</p>
                    <p className="font-extrabold text-emerald-800 text-sm md:text-base mt-1">
                      {formatRupiah(bungaPerBulan)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calculations & Summary */}
          <div className="lg:col-span-5">
            <div className="neumorphic-flat rounded-3xl p-6 md:p-8 border-4 border-[#eae6f4] space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                <h3 className="text-base font-bold text-neutral-800">Kalkulasi Cicilan</h3>
                <span className="material-symbols-outlined text-primary text-3xl">calculate</span>
              </div>

              <div className="neumorphic-inset p-5 rounded-2xl bg-[#fdfbfc]">
                <p className="text-[10px] uppercase font-semibold text-[#474555]">Beban Cicilan Per {tenorUnit === 'bulan' ? 'Bulan' : 'Hari'}</p>
                <h4 className="text-2xl md:text-3xl font-extrabold text-primary mt-1">
                  {formatRupiah(cicilanPerBulan)}
                </h4>
                <p className="text-[10px] text-emerald-800 mt-2 font-bold flex items-center">
                  <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                  Bunga flat {tenorUnit === 'bulan' ? `${interestRate}% diterapkan` : `${dailyInterestRate}% per hari diterapkan`}
                </p>
              </div>

              <div className="space-y-3 pl-1 text-xs">
                <div className="flex justify-between pb-3 border-b border-[#c8c4d8]/40">
                  <span className="text-[#474555] font-semibold">Proyeksi Total Bayar</span>
                  <span className="font-bold text-neutral-800">{formatRupiah(totalBayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#474555] font-semibold">Total Suku Bunga</span>
                  <span className="font-bold text-primary">{formatRupiah(totalBunga)}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  onClick={handleApplySubmit}
                  disabled={hasActiveLoan}
                  className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex justify-center items-center gap-2 transition-all ${
                    hasActiveLoan
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300 shadow-none'
                      : 'neumorphic-primary cursor-pointer shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">
                    {hasActiveLoan ? 'lock' : 'send'}
                  </span>
                  <span>{hasActiveLoan ? 'Pengajuan Terkunci' : 'Setuju & Ajukan'}</span>
                </button>
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="neumorphic-button w-full py-3.5 rounded-xl font-bold text-xs text-[#474555] uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                  <span>Batalkan</span>
                </button>
              </div>

              {/* Graphic Repayment Projection */}
              <div className="mt-6 bg-[#fffdfd] rounded-2xl border border-[#ebdcdc] p-4 shadow-sm">
                <p className="text-xs font-extrabold text-[#7e22ce] uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">auto_graph</span>
                  Grafik Proyeksi Pelunasan Sempurna
                </p>
                
                <div className="w-full h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={projectionData}
                      margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSisa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBayar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9, fill: '#787587', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => {
                          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
                          if (v >= 1000) return `${(v / 1000).toFixed(0)}rb`;
                          return v;
                        }}
                        tick={{ fontSize: 9, fill: '#787587', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatRupiah(Number(value)), '']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #ebdcdc',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={24}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Sisa Pokok"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSisa)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Total Terbayar"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBayar)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-center text-[#877575] font-medium mt-2 leading-tight">
                  Garis merah (<strong className="text-red-500">Sisa Pokok</strong>) akan menurun seiring pembayaran, sedangkan garis hijau (<strong className="text-emerald-600">Total Terbayar</strong>) terus terakumulasi hingga lunas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements & Documentation Section */}
        <section className="mt-12">
          <h3 className="text-base font-extrabold uppercase tracking-widest text-[#1b1b24] mb-4 pl-1">
            Persyaratan & Dokumen Pendukung
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => alert(`Kebijakan Pinjaman: Bunga flat ${interestRate}% per bulan. Maksimal tenor adalah 36 bulan.`)}
              className="neumorphic-flat p-5 rounded-2xl flex items-center gap-4 group cursor-pointer hover:scale-[1.02] transition-transform bg-white"
            >
              <div className="neumorphic-inset p-3 rounded-full text-primary shrink-0 bg-[#fcf8ff]">
                <span className="material-symbols-outlined text-xl">description</span>
              </div>
              <div>
                <p className="font-bold text-xs md:text-sm">Syarat & Ketentuan</p>
                <p className="text-[10px] text-[#474555]">Baca kebijakan pinjaman</p>
              </div>
            </div>

            <div
              onClick={() => {
                const upload = confirm('Apakah Anda ingin mensimulasikan upload foto KTP Anda?');
                if (upload) alert('ID KTP diupload secara sukses! Dokumen dalam verifikasi.');
              }}
              className="neumorphic-flat p-5 rounded-2xl flex items-center gap-4 group cursor-pointer hover:scale-[1.02] transition-transform bg-white"
            >
              <div className="neumorphic-inset p-3 rounded-full text-secondary shrink-0 bg-[#fcf8ff]">
                <span className="material-symbols-outlined text-xl">cloud_upload</span>
              </div>
              <div>
                <p className="font-bold text-xs md:text-sm">Upload KTP/ID</p>
                <p className="text-[10px] text-[#474555]">Wajib untuk verifikasi</p>
              </div>
            </div>

            <div
              onClick={() => alert(`Skor kredit Anda fungsional: 4.8 / 5.0 (SANGAT BAIK)`)}
              className="neumorphic-flat p-5 rounded-2xl flex items-center gap-4 group cursor-pointer hover:scale-[1.02] transition-transform bg-white"
            >
              <div className="neumorphic-inset p-3 rounded-full text-yellow-600 shrink-0 bg-[#fcf8ff]">
                <span className="material-symbols-outlined text-xl">history</span>
              </div>
              <div>
                <p className="font-bold text-xs md:text-sm">Riwayat Kredit</p>
                <p className="text-[10px] text-[#474555]">Lihat track record Anda</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
