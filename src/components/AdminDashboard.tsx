import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, LoanApplication, RecentActivity, StockItem } from '../types';

interface AdminDashboardProps {
  currentUser: Member;
  members: Member[];
  loans: LoanApplication[];
  stock: StockItem[];
  activities: RecentActivity[];
  onLogout: () => void;
  onUpdateDatabase: (updatedData: {
    members?: Member[];
    loans?: LoanApplication[];
    stock?: StockItem[];
    activities?: RecentActivity[];
  }) => void;
  onSwitchRole: (roleId: string) => void;
}

export default function AdminDashboard({
  currentUser,
  members,
  loans,
  stock,
  activities,
  onLogout,
  onUpdateDatabase,
  onSwitchRole,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'loans' | 'stock' | 'savings' | 'settings' | 'orders'>('dashboard');
  const [orders, setOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('kopdes_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [orderFilterStatus, setOrderFilterStatus] = useState<'Semua' | 'Diproses' | 'Dikirim' | 'Tiba di Tujuan'>('Semua');
  const [editingOrderCourierId, setEditingOrderCourierId] = useState<string | null>(null);
  const [tempCourierName, setTempCourierName] = useState('');
  const [tempAwbNumber, setTempAwbNumber] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('kopdes_orders');
    if (saved) {
      setOrders(JSON.parse(saved));
    }
  }, [activeTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // New member form states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberBalance, setNewMemberBalance] = useState(5000000);

  // New stock form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(10000);
  const [newProdStock, setNewProdStock] = useState(100);
  const [newProdCategory, setNewProdCategory] = useState('Sembako');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Settings/Pengaturan form states
  const [coopName, setCoopName] = useState(() => localStorage.getItem('kopdes_coop_name') || 'Koperasi Desa Merah Putih');
  const [interestRate, setInterestRate] = useState(() => parseFloat(localStorage.getItem('kopdes_interest_rate') || '1.5'));
  const [dailyInterestRate, setDailyInterestRate] = useState(() => parseFloat(localStorage.getItem('kopdes_daily_interest_rate') || '0.05'));
  const [maxLoanLimit, setMaxLoanLimit] = useState(() => parseInt(localStorage.getItem('kopdes_max_loan_limit') || '50000000'));
  const [minWithdrawal, setMinWithdrawal] = useState(() => parseInt(localStorage.getItem('kopdes_min_withdrawal') || '50000'));
  const [contactEmail, setContactEmail] = useState(() => localStorage.getItem('kopdes_contact_email') || 'admin@kopdesmerahputih.or.id');
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('kopdes_coop_name', coopName);
    localStorage.setItem('kopdes_interest_rate', interestRate.toString());
    localStorage.setItem('kopdes_daily_interest_rate', dailyInterestRate.toString());
    localStorage.setItem('kopdes_max_loan_limit', maxLoanLimit.toString());
    localStorage.setItem('kopdes_min_withdrawal', minWithdrawal.toString());
    localStorage.setItem('kopdes_contact_email', contactEmail);

    setShowSettingsSuccess(true);
    setTimeout(() => setShowSettingsSuccess(false), 3000);
  };

  // Edit Profile States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatarUrl || '');

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileAvatar(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  // Edit Member States
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberUsername, setEditMemberUsername] = useState('');
  const [editMemberPassword, setEditMemberPassword] = useState('');
  const [editMemberBalance, setEditMemberBalance] = useState(0);
  const [editMemberActiveLoan, setEditMemberActiveLoan] = useState(0);
  const [editMemberRole, setEditMemberRole] = useState<'member' | 'admin'>('member');
  const [deleteMemberConfirmId, setDeleteMemberConfirmId] = useState<string | null>(null);

  // Edit Stock States
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdStock, setEditProdStock] = useState(0);
  const [editProdCategory, setEditProdCategory] = useState('Sembako');
  const [editCustomCategory, setEditCustomCategory] = useState('');

  const handleEditMemberClick = (member: Member) => {
    setEditingMember(member);
    setEditMemberName(member.name);
    setEditMemberUsername(member.username);
    setEditMemberPassword(member.password || '');
    setEditMemberBalance(member.balance || 0);
    setEditMemberActiveLoan(member.activeLoan || 0);
    setEditMemberRole(member.role);
    setIsEditMemberModalOpen(true);
  };

  const handleEditMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editMemberName.trim() || !editMemberUsername.trim()) return;

    const updatedMembers = members.map((m) => {
      if (m.id === editingMember.id) {
        return {
          ...m,
          name: editMemberName,
          username: editMemberUsername.toLowerCase(),
          initials: editMemberName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          password: editMemberPassword.trim() || m.password || editMemberUsername.toLowerCase(),
          balance: editMemberBalance,
          activeLoan: editMemberActiveLoan,
          role: editMemberRole,
        };
      }
      return m;
    });

    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'register',
      title: 'Update Data Anggota',
      description: `Data anggota ${editMemberName} telah diperbarui oleh Admin.`,
      time: 'Baru saja',
      color: 'text-primary',
      icon: 'manage_accounts',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      members: updatedMembers,
      activities: [newActivity, ...activities],
    });

    setIsEditMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const updatedMembers = members.filter((m) => m.id !== memberId);

    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'register',
      title: 'Anggota Dihapus',
      description: `Anggota ${member.name} telah dihapus dari sistem oleh Admin.`,
      time: 'Baru saja',
      color: 'text-red-600',
      icon: 'person_remove',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      members: updatedMembers,
      activities: [newActivity, ...activities],
    });

    setDeleteMemberConfirmId(null);
  };

  const handleEditStockClick = (item: StockItem) => {
    setEditingStock(item);
    setEditProdName(item.name);
    setEditProdPrice(item.price);
    setEditProdStock(item.stock);
    if (['Sembako', 'Elektronik', 'Alat Tulis', 'Kerajinan', 'Pakaian'].includes(item.category)) {
      setEditProdCategory(item.category);
      setEditCustomCategory('');
    } else {
      setEditProdCategory('Lainnya');
      setEditCustomCategory(item.category);
    }
    setIsEditStockModalOpen(true);
  };

  const handleEditStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock || !editProdName.trim()) return;

    const finalCategory = editProdCategory === 'Lainnya' ? (editCustomCategory.trim() || 'Lainnya') : editProdCategory;

    const updatedStock = stock.map((s) => {
      if (s.id === editingStock.id) {
        return {
          ...s,
          name: editProdName,
          price: editProdPrice,
          stock: editProdStock,
          category: finalCategory,
        };
      }
      return s;
    });

    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'stock',
      title: 'Update Detail Produk',
      description: `Detail produk ${editProdName} (${finalCategory}) telah diperbarui oleh Admin.`,
      time: 'Baru saja',
      color: 'text-yellow-600',
      icon: 'edit_note',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      stock: updatedStock,
      activities: [newActivity, ...activities],
    });

    setIsEditStockModalOpen(false);
    setEditingStock(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }
    const updatedMembers = (members || []).map((m) =>
      m.id === currentUser.id
        ? {
            ...m,
            name: profileName,
            avatarUrl: profileAvatar,
            initials: profileName.slice(0, 2).toUpperCase()
          }
        : m
    );
    onUpdateDatabase({ members: updatedMembers });
    setIsEditProfileModalOpen(false);
  };

  // Statistics calculation
  const totalMembersVal = members.filter((m) => m.role === 'member').length + 1245; // baseline from HTML 1,248
  const totalActiveLoansVal = loans
    .filter((l) => l.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalActiveLoansFormatted = (452500000 + totalActiveLoansVal) / 1000000; // M rupiah scale
  
  const totalStockSKUs = stock.length + 836; // baseline from HTML 842
  const totalSavingsVal = members
    .filter((m) => m.role === 'member')
    .reduce((acc, curr) => acc + curr.balance, 0);
  const totalSavingsFormatted = (1200000000 + totalSavingsVal) / 1000000000; // B rupiah scale

  // Filter calculations:
  const filteredLoans = loans.filter((l) => {
    if (activeTab === 'loans') return true; // show all under loans tab
    return l.status === 'pending'; // only pending in dashboard
  }).filter((l) => {
    return (
      l.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredMembers = members.filter((m) => {
    return (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredStock = stock.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Actions
  const handleApproveLoan = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    // Update loan status
    const updatedLoans = loans.map((l) =>
      l.id === loanId ? { ...l, status: 'approved' as const } : l
    );

    // Update member's active loan balance
    const updatedMembers = members.map((m) =>
      m.id === loan.memberId ? { ...m, activeLoan: (m.activeLoan || 0) + loan.amount } : m
    );

    // Create fresh dynamic recent activity
    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'loan_approved',
      title: 'Pinjaman Disetujui',
      description: `Pinjaman Rp ${(loan.amount / 1000000).toFixed(1)}jt milik ${loan.memberName} telah disetujui.`,
      time: 'Baru saja',
      color: 'text-primary',
      icon: 'verified',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      loans: updatedLoans,
      members: updatedMembers,
      activities: [newActivity, ...activities],
    });
  };

  const handleRejectLoan = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    // Set layout to rejected
    const updatedLoans = loans.map((l) =>
      l.id === loanId ? { ...l, status: 'rejected' as const } : l
    );

    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'loan_submit',
      title: 'Pinjaman Ditolak',
      description: `Pengajuan Rp ${(loan.amount / 1000000).toFixed(1)}jt milik ${loan.memberName} ditolak.`,
      time: 'Baru saja',
      color: 'text-[#8b7474]',
      icon: 'cancel',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      loans: updatedLoans,
      activities: [newActivity, ...activities],
    });
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberUsername.trim()) return;

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: newMemberName,
      username: newMemberUsername.toLowerCase(),
      initials: newMemberName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      role: 'member',
      balance: newMemberBalance,
      activeLoan: 0,
      password: newMemberPassword.trim() || newMemberUsername.toLowerCase(),
    };

    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'register',
      title: 'Anggota Baru Terdaftar',
      description: `${newMember.name} bergabung ke dalam koperasi.`,
      time: 'Baru saja',
      color: 'text-primary',
      icon: 'person_add',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      members: [...members, newMember],
      activities: [newActivity, ...activities],
    });

    // Reset fields
    setNewMemberName('');
    setNewMemberUsername('');
    setNewMemberPassword('');
    setNewMemberBalance(5000000);
    setIsNewMemberModalOpen(false);
  };

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const finalCategory = newProdCategory === 'Lainnya' ? (newCustomCategory.trim() || 'Lainnya') : newProdCategory;

    const newSKU = `SKU-${Date.now().toString().slice(-6)}`;
    const newProduct: StockItem = {
      id: `stock-${Date.now()}`,
      name: newProdName,
      sku: newSKU,
      price: newProdPrice,
      stock: newProdStock,
      category: finalCategory,
    };

    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'stock',
      title: 'Update Stok Barang',
      description: `Stok ${newProdName} (${finalCategory}) ditambahkan sebanyak ${newProdStock} unit.`,
      time: 'Baru saja',
      color: 'text-yellow-600',
      icon: 'inventory_2',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      stock: [...stock, newProduct],
      activities: [newActivity, ...activities],
    });

    setNewProdName('');
    setNewProdPrice(10000);
    setNewProdStock(100);
    setNewProdCategory('Sembako');
    setNewCustomCategory('');
    setIsNewProductModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#fffbff] text-[#201a1a] font-sans antialiased flex">
      {/* SideNavBar */}
      <aside className="w-64 bg-[#fffbff] shadow-[6px_6px_12px_#e5dada] flex flex-col py-6 border-r border-[#d8c2c2]/20 shrink-0 h-screen sticky top-0">
        <div className="px-6 mb-8 flex flex-col">
          <img
            alt="Koperasi Desa Merah Putih Logo"
            className="h-14 w-auto object-contain mb-1 self-start"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBesQ7DtURo8RyQyK3Vp8Jral0gKBi9uc5m1kZD5l6JrU9tdsamqGxe-QmA53WlSCyzR2p5bCh120hrE5ZCRoawDJXekGphDQR8tPYNHEGjjuLUTYBMMxrtL-hcTpI7ZZOXv_wEZzZHmivoednfrZBp24L1uCfWsJoREfuN24z5e8Rgb6rnOMLOWzTNBTGN7zWrJQw2c2WR4esxlwsI1jV0-juXxlz0p2cSAA1a2s1J7K9iK6jFvD_zKoitSNZaVEMOfB1sH_MQkI4"
          />
          <p className="text-xs font-semibold text-[#534343]/70 tracking-widest uppercase">
            Management Portal
          </p>
        </div>

        <nav className="flex-grow px-2 space-y-1">
          {/* Active State Tabs */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#fffbff] shadow-[inset_4px_4px_8px_#e5dada,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#534343] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-all ${
              activeTab === 'members'
                ? 'bg-[#fffbff] shadow-[inset_4px_4px_8px_#e5dada,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#534343] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">group</span>
            <span className="text-sm">Members</span>
          </button>

          <button
            onClick={() => setActiveTab('loans')}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-all ${
              activeTab === 'loans'
                ? 'bg-[#fffbff] shadow-[inset_4px_4px_8px_#e5dada,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#534343] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">account_balance</span>
            <span className="text-sm">Loans</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-all ${
              activeTab === 'stock'
                ? 'bg-[#fffbff] shadow-[inset_4px_4px_8px_#e5dada,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#534343] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">inventory_2</span>
            <span className="text-sm">Stock (SKU)</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-all ${
              activeTab === 'orders'
                ? 'bg-[#fffbff] shadow-[inset_4px_4px_8px_#e5dada,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#534343] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">local_shipping</span>
            <span className="text-sm flex-grow">Kelola Pengiriman</span>
            {orders.filter(o => o.status !== 'Tiba di Tujuan').length > 0 && (
              <span className="bg-primary text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse ml-1 shrink-0">
                {orders.filter(o => o.status !== 'Tiba di Tujuan').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('savings')}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-all ${
              activeTab === 'savings'
                ? 'bg-[#fffbff] shadow-[inset_4px_4px_8px_#e5dada,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#534343] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">payments</span>
            <span className="text-sm">Savings Log</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-all ${
              activeTab === 'settings'
                ? 'bg-[#fffbff] shadow-[inset_4px_4px_8px_#e5dada,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#534343] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">settings</span>
            <span className="text-sm">Pengaturan</span>
          </button>
        </nav>

        <div className="px-4 mb-4">
          <button
            onClick={() => {
              if (activeTab === 'stock') {
                setIsNewProductModalOpen(true);
              } else {
                setIsNewMemberModalOpen(true);
              }
            }}
            className="w-full neumorphic-elevated hover:bg-neutral-50 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all text-primary text-sm cursor-pointer"
          >
            {activeTab === 'stock' ? '+ Tambah Produk' : '+ Tambah Anggota'}
          </button>
        </div>

        <div className="border-t border-[#d8c2c2]/50 pt-4 px-2 space-y-1">
          {/* Quick simulation link */}
          <div className="px-4 py-2 bg-red-50 rounded-xl mx-2 mb-2">
            <span className="text-[10px] text-red-600 font-bold block mb-1">SIMULATOR LINK:</span>
            <button
              onClick={() => onSwitchRole('budi')}
              className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer w-full text-left"
            >
              <span className="material-symbols-outlined text-xs">switch_account</span>
              Masuk Anggota (Budi)
            </button>
          </div>

          <button
            onClick={() => alert('Pusat Bantuan Koperasi: Silakan hubungi admin@kopdesmerahputih.or.id')}
            className="w-full text-left text-[#534343]/80 font-medium rounded-xl flex items-center px-4 py-2.5 hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:text-primary transition-all text-sm"
          >
            <span className="material-symbols-outlined mr-3 text-lg">help</span>
            <span>Help Center</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full text-left text-red-600 font-semibold rounded-xl flex items-center px-4 py-2.5 hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#e5dada] hover:bg-red-50 transition-all text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3 text-lg">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow min-h-screen flex flex-col">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 bg-[#fffbff]/95 backdrop-blur-sm shadow-[0_4px_12px_-4px_rgba(163,177,198,0.2)] flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="neumorphic-inset flex items-center px-4 py-2 rounded-full w-full max-w-md">
              <span className="material-symbols-outlined text-[#8b7474]">search</span>
              <input
                className="bg-transparent border-none outline-none focus:ring-0 text-sm w-full px-2 text-[#534343] font-sans"
                placeholder={
                  activeTab === 'stock'
                    ? 'Cari nama produk SKU...'
                    : activeTab === 'members'
                    ? 'Cari nama anggota...'
                    : activeTab === 'orders'
                    ? 'Cari ID pesanan, penerima, atau resi...'
                    : 'Cari data anggota atau pinjaman...'
                }
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <button
                onClick={() => alert('Anda tidak memiliki notifikasi baru.')}
                className="neumorphic-elevated p-2 rounded-full text-[#534343] hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-1 right-1 w-2 search-dot bg-red-600 rounded-full h-2"></span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`p-2 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-primary text-white shadow-inner'
                    : 'neumorphic-elevated text-[#534343]'
                }`}
              >
                <span className="material-symbols-outlined text-xl">settings</span>
              </button>
            </div>

            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              title="Ubah Profil Saya"
              className="flex items-center gap-3 pl-4 border-l border-[#d8c2c2] hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer bg-transparent border-none text-left focus:outline-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#201a1a] flex items-center gap-1 justify-end">
                  {currentUser.name}
                  <span className="material-symbols-outlined text-[10px] text-[#8b7474]">edit</span>
                </p>
                <p className="text-xs text-[#8b7474] font-medium">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full neumorphic-elevated p-0.5 overflow-hidden shrink-0">
                <img
                  alt="User profile avatar"
                  className="w-full h-full object-cover rounded-full"
                  src={currentUser.avatarUrl}
                />
              </div>
            </button>
          </div>
        </header>

        {/* Dashboard Grid & Body */}
        <div className="p-8 flex-grow">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Breadcrumbs / Page Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#201a1a]">
                    Dashboard Koperasi Desa Merah Putih
                  </h2>
                  <p className="text-sm text-[#534343] mt-1">
                    Selamat datang kembali, berikut ringkasan data hari ini.
                  </p>
                </div>
                <img
                  alt="Koperasi Logo Small"
                  className="h-12 w-auto"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBesQ7DtURo8RyQyK3Vp8Jral0gKBi9uc5m1kZD5l6JrU9tdsamqGxe-QmA53WlSCyzR2p5bCh120hrE5ZCRoawDJXekGphDQR8tPYNHEGjjuLUTYBMMxrtL-hcTpI7ZZOXv_wEZzZHmivoednfrZBp24L1uCfWsJoREfuN24z5e8Rgb6rnOMLOWzTNBTGN7zWrJQw2c2WR4esxlwsI1jV0-juXxlz0p2cSAA1a2s1J7K9iK6jFvD_zKoitSNZaVEMOfB1sH_MQkI4"
                />
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Anggota */}
                <div className="neumorphic-elevated p-5 rounded-3xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-3 neumorphic-inset rounded-2xl text-primary">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <span className="text-[#9c4242] text-xs font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">trending_up</span> 12%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#534343] mt-4">Total Anggota</p>
                    <h3 className="text-2xl font-extrabold text-[#201a1a]">
                      {new Intl.NumberFormat('id-ID').format(totalMembersVal)}
                    </h3>
                  </div>
                </div>

                {/* Total Pinjaman Aktif */}
                <div className="neumorphic-elevated p-5 rounded-3xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-3 neumorphic-inset rounded-2xl text-yellow-600">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <span className="text-[#9c4242] text-xs font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">trending_up</span> 8%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#534343] mt-4">Total Pinjaman Aktif</p>
                    <h3 className="text-2xl font-extrabold text-[#201a1a]">
                      Rp {totalActiveLoansFormatted.toFixed(1)}M
                    </h3>
                  </div>
                </div>

                {/* Stok Barang SKU */}
                <div className="neumorphic-elevated p-5 rounded-3xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-3 neumorphic-inset rounded-2xl text-[#9c4242]">
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <span className="text-red-600 text-xs font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">trending_down</span> 3%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#534343] mt-4">Stok Barang (SKU)</p>
                    <h3 className="text-2xl font-extrabold text-[#201a1a]">
                      {totalStockSKUs}
                    </h3>
                  </div>
                </div>

                {/* Total Simpanan */}
                <div className="neumorphic-elevated p-5 rounded-3xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-3 neumorphic-inset rounded-2xl text-primary">
                      <span className="material-symbols-outlined">savings</span>
                    </div>
                    <span className="text-[#9c4242] text-xs font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">trending_up</span> 15%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#534343] mt-4">Total Simpanan</p>
                    <h3 className="text-2xl font-extrabold text-[#201a1a]">
                      Rp {totalSavingsFormatted.toFixed(2)}B
                    </h3>
                  </div>
                </div>
              </div>

              {/* Dashboard Main Bento Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Persetujuan Pinjaman Terbaru (Bento Span 2 Cols) */}
                <div className="lg:col-span-2 neumorphic-elevated rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-[#201a1a]">
                      Persetujuan Pinjaman Terbaru
                    </h3>
                    <button
                      onClick={() => setActiveTab('loans')}
                      className="text-primary text-xs font-bold hover:underline cursor-pointer"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  <div className="flex-grow overflow-x-auto">
                    {filteredLoans.length === 0 ? (
                      <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#d8c2c2]/20 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl text-[#8b7474]/50 mb-2">
                          assignment_turned_in
                        </span>
                        <p className="text-sm font-semibold text-[#534343]">
                          Tidak Ada Pengajuan Pending
                        </p>
                        <p className="text-xs text-[#8b7474] mt-1">
                          Semua kuesioner pengajuan kredit pinjaman telah diproses.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#d8c2c2]/30">
                            <th className="pb-3 text-xs font-semibold text-[#8b7474]">Nama Anggota</th>
                            <th className="pb-3 text-xs font-semibold text-[#8b7474]">Jumlah Pinjaman</th>
                            <th className="pb-3 text-xs font-semibold text-[#8b7474]">Tanggal/Tujuan</th>
                            <th className="pb-3 text-xs font-semibold text-[#8b7474] text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d8c2c2]/10">
                          <AnimatePresence>
                            {filteredLoans.map((loan) => (
                              <motion.tr
                                key={loan.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -30 }}
                                className="group hover:bg-[#fffbff]/50 transition-colors"
                              >
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-primary font-bold text-xs select-none">
                                      {loan.memberInitials}
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold block">
                                        {loan.memberName}
                                      </span>
                                      <span className="text-[10px] text-[#8b7474] block">
                                        Tenor: {loan.tenor} Bulan
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 text-sm font-bold">
                                  Rp {new Intl.NumberFormat('id-ID').format(loan.amount)}
                                </td>
                                <td className="py-4">
                                  <span className="text-xs font-medium text-[#201a1a] block">
                                    {loan.date}
                                  </span>
                                  <span className="text-[10px] text-yellow-700 font-semibold block">
                                    {loan.purpose}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => handleApproveLoan(loan.id)}
                                      className="neumorphic-elevated bg-white px-3 py-1.5 rounded-full text-emerald-700 text-xs font-bold hover:scale-105 active:scale-95 hover:bg-emerald-50 transition-transform cursor-pointer"
                                    >
                                      Setujui
                                    </button>
                                    <button
                                      onClick={() => handleRejectLoan(loan.id)}
                                      className="neumorphic-elevated bg-white px-3 py-1.5 rounded-full text-red-600 text-xs font-bold hover:scale-105 active:scale-95 hover:bg-red-50 transition-transform cursor-pointer"
                                    >
                                      Tolak
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Aktivitas Terkini Bento item */}
                <div className="neumorphic-elevated rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-[#201a1a] mb-5">Aktivitas Terkini</h3>
                  <div className="flex flex-col gap-5 overflow-y-auto max-h-[350px]">
                    {activities.map((act) => (
                      <div key={act.id} className="flex gap-4.5 group">
                        <div className="w-10 h-10 neumorphic-inset rounded-full flex items-center justify-center shrink-0 text-primary">
                          <span className="material-symbols-outlined text-lg">{act.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{act.title}</p>
                          <p className="text-xs text-[#534343]">{act.description}</p>
                          <span className="text-[10px] text-[#8b7474] mt-1 block">
                            {act.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => alert('Visualisasi total riwayat aktivitas diarsipkan secara periodik.')}
                    className="w-full mt-6 py-3 neumorphic-inset rounded-2xl text-xs font-bold text-[#534343] hover:text-primary transition-all cursor-pointer"
                  >
                    Lihat Log Aktivitas
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Members Table Tab */}
          {activeTab === 'members' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#201a1a]">Anggota Koperasi Terdaftar</h2>
                  <p className="text-xs text-[#534343]">Kelola data tabungan serta kewajiban setiap anggota.</p>
                </div>
                <button
                  onClick={() => setIsNewMemberModalOpen(true)}
                  className="neumorphic-elevated px-4 py-2 rounded-xl text-primary font-bold text-xs hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                >
                  + Tambah Anggota Baru
                </button>
              </div>

              <div className="neumorphic-elevated rounded-3xl p-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#d8c2c2]/30">
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">ID / Nama</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Username</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Role</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Saldo Simpanan</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Pinjaman Aktif</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474] text-center">Simulasi</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474] text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8c2c2]/10">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-neutral-50/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                className="w-8 h-8 rounded-full object-cover"
                                alt="avatar"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-primary font-bold text-xs">
                                {member.initials}
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-bold block">{member.name}</span>
                              <span className="text-[10px] text-[#8b7474] block">ID: {member.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm font-medium">{member.username}</td>
                        <td className="py-4 text-xs font-bold text-neutral-600">
                          <span className={`px-2.5 py-1 rounded-full ${member.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                            {member.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-sm font-bold">
                          {member.role === 'admin'
                            ? '-'
                            : `Rp ${new Intl.NumberFormat('id-ID').format(member.balance || 0)}`}
                        </td>
                        <td className="py-4 text-sm font-bold text-[#ce2029]">
                          {member.role === 'admin'
                            ? '-'
                            : `Rp ${new Intl.NumberFormat('id-ID').format(member.activeLoan || 0)}`}
                        </td>
                        <td className="py-4 text-center">
                          {member.role === 'member' && (
                            <button
                              onClick={() => onSwitchRole(member.id)}
                              className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-full shadow-[2px_2px_5px_rgba(163,177,198,0.2)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              Masuk Sebagai
                            </button>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {deleteMemberConfirmId === member.id ? (
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="text-xs text-white bg-red-600 hover:bg-red-700 font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                              >
                                <span className="material-symbols-outlined text-xs">done</span>
                                <span>Ya, Hapus</span>
                              </button>
                              <button
                                onClick={() => setDeleteMemberConfirmId(null)}
                                className="text-xs text-neutral-600 bg-neutral-100 hover:bg-[#e5dada] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEditMemberClick(member)}
                                className="text-xs text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                                <span>Edit</span>
                              </button>
                              {member.id !== currentUser.id && (
                                <button
                                  onClick={() => setDeleteMemberConfirmId(member.id)}
                                  className="text-xs text-neutral-500 hover:text-red-700 font-semibold bg-neutral-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Loans Approvals Log */}
          {activeTab === 'loans' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#201a1a]">Riwayat & Pengajuan Pinjaman</h2>
                <p className="text-xs text-[#534343]">Log administratif seluruh pinjaman anggota koperasi.</p>
              </div>

              <div className="neumorphic-elevated rounded-3xl p-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#d8c2c2]/30">
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Anggota</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Jumlah</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Tenor</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Tujuan</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Status</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474] text-center">Aksi Administrasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8c2c2]/10">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-neutral-50/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-primary font-bold text-xs">
                              {loan.memberInitials}
                            </div>
                            <span className="text-sm font-bold">{loan.memberName}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm font-bold">
                          Rp {new Intl.NumberFormat('id-ID').format(loan.amount)}
                        </td>
                        <td className="py-4 text-xs font-semibold">{loan.tenor} Bulan</td>
                        <td className="py-4 text-xs text-neutral-600 font-medium">{loan.purpose}</td>
                        <td className="py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              loan.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : loan.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {loan.status === 'approved'
                              ? 'DISETUJUI'
                              : loan.status === 'rejected'
                              ? 'DITOLAK'
                              : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          {loan.status === 'pending' ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleApproveLoan(loan.id)}
                                className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-all cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleRejectLoan(loan.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#8b7474] font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Stock Page */}
          {activeTab === 'stock' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#201a1a]">Stok Inventaris Toko Koperasi</h2>
                  <p className="text-xs text-[#534343]">Kelola SKU, persediaan barang, serta harga eceran toko.</p>
                </div>
                <button
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="neumorphic-elevated px-4 py-2 rounded-xl text-primary font-bold text-xs hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                >
                  + Tambah Produk Baru
                </button>
              </div>

              <div className="neumorphic-elevated rounded-3xl p-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#d8c2c2]/30">
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Produk</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">SKU</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Kategori</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Harga</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Sisa Stok</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474] text-center font-semibold">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8c2c2]/10">
                    {filteredStock.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50">
                        <td className="py-4 text-sm font-bold">{item.name}</td>
                        <td className="py-4 text-xs font-mono font-bold text-[#8b7474]">{item.sku}</td>
                        <td className="py-4 text-xs font-medium text-neutral-600">{item.category}</td>
                        <td className="py-4 text-sm font-bold text-[#201a1a]">
                          Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                        </td>
                        <td className="py-4 text-sm font-bold">
                          <span
                            className={
                              item.stock < 100
                                ? 'text-red-600 font-extrabold'
                                : 'text-neutral-700'
                            }
                          >
                            {item.stock} Unit
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          {deleteConfirmId === item.id ? (
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => {
                                  const updated = stock.filter((s) => s.id !== item.id);
                                  onUpdateDatabase({ stock: updated });
                                  setDeleteConfirmId(null);
                                }}
                                className="text-xs text-white bg-red-600 hover:bg-red-700 font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                              >
                                <span className="material-symbols-outlined text-xs">done</span>
                                <span>Ya, Hapus</span>
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs text-neutral-600 bg-neutral-100 hover:bg-[#e5dada] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEditStockClick(item)}
                                className="text-xs text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  const updated = stock.map((s) =>
                                    s.id === item.id ? { ...s, stock: s.stock + 50 } : s
                                  );
                                  onUpdateDatabase({ stock: updated });
                                }}
                                className="text-xs text-primary font-bold bg-red-50 hover:bg-red-100/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">add</span>
                                <span>Pasok +50</span>
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="text-xs text-neutral-500 hover:text-red-700 font-semibold bg-neutral-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Savings Log Tab */}
          {activeTab === 'savings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#201a1a]">Riwayat Simpanan & Top Up</h2>
                <p className="text-xs text-[#534343]">Catatan saldo deposit terbaru dari seluruh fungsionaris anggota.</p>
              </div>

              <div className="neumorphic-elevated rounded-3xl p-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#d8c2c2]/30">
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Anggota</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Metode / Deskripsi</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Status</th>
                      <th className="pb-3 text-xs font-semibold text-[#8b7474]">Besaran Simpanan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8c2c2]/10">
                    {members
                      .filter((m) => m.role === 'member')
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-neutral-50/50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-primary font-bold text-xs">
                                {m.initials}
                              </div>
                              <span className="text-sm font-bold">{m.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-xs font-semibold text-neutral-600">
                            Simpanan Terkonsolidasi (Wajib/Pokok)
                          </td>
                          <td className="py-4">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">
                              AKTIF
                            </span>
                          </td>
                          <td className="py-4 text-sm font-bold text-[#006d3c]">
                            Rp {new Intl.NumberFormat('id-ID').format(m.balance)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Settings / Pengaturan Tab */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#201a1a]">Pengaturan Sistem Koperasi</h2>
                  <p className="text-xs text-[#534343]">Konfigurasi suku bunga, batas limit transaksi, dan identitas koperasi.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold shadow-sm">
                  <span className="material-symbols-outlined text-xs">verified_user</span>
                  OTORISASI SUPER ADMIN AKTIF
                </div>
              </div>

              {showSettingsSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-2 font-semibold text-sm shadow-md"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Pengaturan berhasil disimpan dan diaktifkan secara realtime!</span>
                </motion.div>
              )}

              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel Kiri: Finansial */}
                <div className="neumorphic-elevated rounded-3xl p-6 md:p-8 space-y-6">
                  <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b border-[#d8c2c2]/20 pb-3">
                    <span className="material-symbols-outlined text-lg">payments</span>
                    Parameter Finansial & Pinjaman
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8b7474] ml-1">Suku Bunga Bulanan (% Flat)</label>
                      <div className="neumorphic-inset flex items-center px-4 py-3 rounded-xl bg-[#fdfbfc]">
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#201a1a]"
                          value={interestRate}
                          onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-xs font-bold text-neutral-500">%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8b7474] ml-1">Suku Bunga Harian (% Flat)</label>
                      <div className="neumorphic-inset flex items-center px-4 py-3 rounded-xl bg-[#fdfbfc]">
                        <input
                          type="number"
                          step="0.001"
                          required
                          className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#201a1a]"
                          value={dailyInterestRate}
                          onChange={(e) => setDailyInterestRate(parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-xs font-bold text-neutral-500">%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8b7474] ml-1">Batas Maksimal Pinjaman (Rp)</label>
                      <div className="neumorphic-inset flex items-center px-4 py-3 rounded-xl bg-[#fdfbfc]">
                        <input
                          type="number"
                          required
                          className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#201a1a]"
                          value={maxLoanLimit}
                          onChange={(e) => setMaxLoanLimit(parseInt(e.target.value) || 0)}
                        />
                        <span className="text-xs font-bold text-neutral-500">Rp</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Kanan: Aturan Kas & Profil */}
                <div className="neumorphic-elevated rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b border-[#d8c2c2]/20 pb-3">
                      <span className="material-symbols-outlined text-lg">storefront</span>
                      Profil Koperasi & Kas
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#8b7474] ml-1">Nama Koperasi Utama</label>
                        <div className="neumorphic-inset flex items-center px-4 py-3 rounded-xl bg-[#fdfbfc]">
                          <input
                            type="text"
                            required
                            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#201a1a]"
                            value={coopName}
                            onChange={(e) => setCoopName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#8b7474] ml-1">Saldo Penarikan Minimum (Rp)</label>
                        <div className="neumorphic-inset flex items-center px-4 py-3 rounded-xl bg-[#fdfbfc]">
                          <input
                            type="number"
                            required
                            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#201a1a]"
                            value={minWithdrawal}
                            onChange={(e) => setMinWithdrawal(parseInt(e.target.value) || 0)}
                          />
                          <span className="text-xs font-bold text-neutral-500">Rp</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#8b7474] ml-1">Email Kontak Pengurus</label>
                        <div className="neumorphic-inset flex items-center px-4 py-3 rounded-xl bg-[#fdfbfc]">
                          <input
                            type="email"
                            required
                            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#201a1a]"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-[#a31d22] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex justify-center items-center gap-2 border-none font-sans text-xs uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Simpan Perubahan Pengaturan</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* Kelola Pengiriman Tab */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#201a1a] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
                    Pusat Kontrol Logistik & Pengiriman (Kopdes Express)
                  </h2>
                  <p className="text-xs text-[#534343]">
                    Kelola, atur kurir, perbarui resi, dan kirimkan pesanan belanja anggota secara real-time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-primary border border-red-100 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-xs">
                    {orders.filter(o => o.status !== 'Tiba di Tujuan').length} PAKET AKTIF
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin mengatur ulang semua pesanan ke status awal (Diproses)?')) {
                        const resetOrders = orders.map(o => ({
                          ...o,
                          status: 'Diproses',
                          history: [{
                            status: 'Diproses',
                            date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
                            description: 'Pesanan sedang diproses dan dikemas rapi di gudang Koperasi Desa.'
                          }]
                        }));
                        setOrders(resetOrders);
                        localStorage.setItem('kopdes_orders', JSON.stringify(resetOrders));
                        alert('Semua pesanan di-reset ke status Diproses.');
                      }
                    }}
                    className="neumorphic-elevated hover:bg-neutral-50 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-600 transition-all cursor-pointer border-none bg-transparent"
                  >
                    Reset Semua Status
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="neumorphic-elevated bg-[#fffbff] p-4 rounded-2xl border-l-4 border-neutral-400 text-left">
                  <span className="text-[10px] font-extrabold text-[#8b7474] uppercase tracking-wider">Total Pesanan</span>
                  <p className="text-xl font-extrabold text-[#201a1a] mt-1">{orders.length} Paket</p>
                </div>
                <div className="neumorphic-elevated bg-[#fffbff] p-4 rounded-2xl border-l-4 border-orange-500 text-left">
                  <span className="text-[10px] font-extrabold text-[#8b7474] uppercase tracking-wider">Sedang Diproses</span>
                  <p className="text-xl font-extrabold text-orange-600 mt-1">
                    {orders.filter(o => o.status === 'Diproses').length} Paket
                  </p>
                </div>
                <div className="neumorphic-elevated bg-[#fffbff] p-4 rounded-2xl border-l-4 border-blue-500 text-left">
                  <span className="text-[10px] font-extrabold text-[#8b7474] uppercase tracking-wider">Sedang Dikirim</span>
                  <p className="text-xl font-extrabold text-blue-600 mt-1">
                    {orders.filter(o => o.status === 'Dikirim').length} Paket
                  </p>
                </div>
                <div className="neumorphic-elevated bg-[#fffbff] p-4 rounded-2xl border-l-4 border-emerald-500 text-left">
                  <span className="text-[10px] font-extrabold text-[#8b7474] uppercase tracking-wider">Sudah Tiba</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">
                    {orders.filter(o => o.status === 'Tiba di Tujuan').length} Paket
                  </p>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex gap-2 border-b border-[#d8c2c2]/20 pb-1 overflow-x-auto whitespace-nowrap">
                {(['Semua', 'Diproses', 'Dikirim', 'Tiba di Tujuan'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderFilterStatus(status)}
                    className={`px-4 py-2 font-bold text-xs rounded-xl transition-all border-none cursor-pointer ${
                      orderFilterStatus === status
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 bg-transparent'
                    }`}
                  >
                    {status} ({
                      status === 'Semua' 
                        ? orders.length 
                        : orders.filter(o => o.status === status).length
                    })
                  </button>
                ))}
              </div>

              {/* Orders List / Control Panel */}
              <div className="space-y-4">
                {(() => {
                  const filteredOrders = orders.filter((o) => {
                    const matchesSearch = 
                      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (o.recipientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (o.awb || '').toLowerCase().includes(searchQuery.toLowerCase());
                    
                    const matchesStatus = orderFilterStatus === 'Semua' ? true : o.status === orderFilterStatus;
                    
                    return matchesSearch && matchesStatus;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="neumorphic-elevated rounded-3xl p-12 text-center bg-[#fffbff]">
                        <span className="material-symbols-outlined text-4xl text-neutral-300">local_shipping</span>
                        <p className="text-sm font-bold text-neutral-500 mt-2">Tidak ada pesanan belanja yang cocok dengan filter atau pencarian Anda.</p>
                      </div>
                    );
                  }

                  return filteredOrders.map((order) => {
                    const isEditingCourier = editingOrderCourierId === order.id;
                    const orderDateStr = order.date || order.history[order.history.length - 1]?.date || 'Baru Saja';
                    const displayInv = order.id.startsWith('ord-') ? 'INV-' + order.id.slice(4, 11).toUpperCase() : order.id;

                    const handleStartEditCourier = () => {
                      setEditingOrderCourierId(order.id);
                      setTempCourierName(order.courier);
                      setTempAwbNumber(order.awb);
                    };

                    const handleSaveCourierChanges = () => {
                      if (!tempCourierName.trim() || !tempAwbNumber.trim()) {
                        alert('Nama kurir dan nomor resi wajib diisi!');
                        return;
                      }
                      
                      const updated = orders.map(o => {
                        if (o.id === order.id) {
                          return {
                            ...o,
                            courier: tempCourierName.trim(),
                            awb: tempAwbNumber.trim()
                          };
                        }
                        return o;
                      });

                      setOrders(updated);
                      localStorage.setItem('kopdes_orders', JSON.stringify(updated));
                      setEditingOrderCourierId(null);

                      // Cooperative notification
                      const newAct: RecentActivity = {
                        id: `act-${Date.now()}`,
                        type: 'stock',
                        title: 'Info Kurir Diubah',
                        description: `Kurir untuk pesanan ${displayInv} diubah menjadi ${tempCourierName} (Resi: ${tempAwbNumber}).`,
                        time: 'Baru saja',
                        color: 'text-[#8b7474]',
                        icon: 'motorcycle',
                        timestamp: new Date().toISOString(),
                      };
                      onUpdateDatabase({ activities: [newAct, ...activities] });
                    };

                    const handleUpdateStatusAction = (newStatus: 'Diproses' | 'Dikirim' | 'Tiba di Tujuan') => {
                      const finalCourier = order.courier;
                      const finalAwb = order.awb;

                      let logDescription = '';
                      const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';
                      
                      if (newStatus === 'Dikirim') {
                        logDescription = `[Kopdes Express Hub Desa] Paket telah diserahkan kepada Kurir ${finalCourier.split('(')[0].trim()} dan kini sedang dalam perjalanan menuju alamat Anda.`;
                      } else if (newStatus === 'Tiba di Tujuan') {
                        const memberName = members.find(m => m.id === order.memberId)?.name || 'Anda';
                        logDescription = `[Diterima] Paket telah berhasil diterima dengan aman oleh yang bersangkutan (${memberName}) di alamat tujuan.`;
                      } else {
                        logDescription = `Pesanan sedang diproses dan dikemas rapi di gudang Koperasi Desa.`;
                      }

                      const updated = orders.map(o => {
                        if (o.id === order.id) {
                          const newHistoryLog = {
                            status: newStatus,
                            date: nowStr,
                            description: logDescription
                          };
                          // Remove previous exact duplicate statuses from logs before appending new
                          const filteredHistory = o.history.filter((h: any) => h.status !== newStatus);
                          return {
                            ...o,
                            status: newStatus,
                            history: [newHistoryLog, ...filteredHistory]
                          };
                        }
                        return o;
                      });

                      setOrders(updated);
                      localStorage.setItem('kopdes_orders', JSON.stringify(updated));

                      // Cooperative recent activity log
                      const newAct: RecentActivity = {
                        id: `act-${Date.now()}`,
                        type: 'stock',
                        title: `Pengiriman ${newStatus}`,
                        description: `Status pengiriman paket ${displayInv} diperbarui menjadi [${newStatus}] oleh Admin Koperasi.`,
                        time: 'Baru saja',
                        color: newStatus === 'Tiba di Tujuan' ? 'text-emerald-600' : 'text-blue-600',
                        icon: 'local_shipping',
                        timestamp: new Date().toISOString(),
                      };
                      onUpdateDatabase({ activities: [newAct, ...activities] });
                    };

                    return (
                      <div key={order.id} className="neumorphic-elevated bg-[#fffbff] rounded-3xl p-6 border border-neutral-100 flex flex-col gap-6 text-left">
                        {/* Order Header / Row 1 */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-extrabold text-[#8b7474] tracking-wide">{displayInv}</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                order.status === 'Tiba di Tujuan'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : order.status === 'Dikirim'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-orange-50 text-orange-700 border border-orange-200'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-1 font-semibold">Dibuat: {orderDateStr}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {order.status === 'Diproses' && (
                              <button
                                onClick={() => handleUpdateStatusAction('Dikirim')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                              >
                                <span className="material-symbols-outlined text-xs">local_shipping</span>
                                <span>Serahkan ke Kurir (Kirim)</span>
                              </button>
                            )}

                            {order.status === 'Dikirim' && (
                              <button
                                onClick={() => handleUpdateStatusAction('Tiba di Tujuan')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                              >
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>Paket Selesai (Diterima)</span>
                              </button>
                            )}

                            {order.status === 'Tiba di Tujuan' && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Apakah Anda ingin membatalkan status Selesai untuk pesanan ini dan mengembalikannya ke status Dikirim?')) {
                                    handleUpdateStatusAction('Dikirim');
                                  }
                                }}
                                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">undo</span>
                                <span>Kembalikan ke Dikirim</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                  if (window.confirm('Apakah Anda yakin ingin menghapus catatan transaksi pengiriman ini dari arsip?')) {
                                    const updated = orders.filter(o => o.id !== order.id);
                                    setOrders(updated);
                                    localStorage.setItem('kopdes_orders', JSON.stringify(updated));
                                  }
                              }}
                              className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer border-none bg-transparent"
                              title="Hapus Transaksi"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Body Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Col 1: Customer Details */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Penerima & Alamat</h4>
                            <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 space-y-1">
                              <p className="font-extrabold text-xs text-neutral-800">
                                {members.find(m => m.id === order.memberId)?.name || 'Anggota Koperasi'}
                              </p>
                              <p className="text-[11px] text-[#554545] font-semibold">
                                Telepon: {(members.find(m => m.id === order.memberId) as any)?.phone || '0812-4455-8899'}
                              </p>
                              <p className="text-[11px] text-neutral-500 leading-relaxed break-words">
                                {(members.find(m => m.id === order.memberId) as any)?.address || 'RT 04 / RW 02, Desa Sukamakmur, Jawa Barat'}
                              </p>
                            </div>
                          </div>

                          {/* Col 2: Products Ordered */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Item Belanja</h4>
                            <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 space-y-2 max-h-[140px] overflow-y-auto">
                              {order.items.map((it: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span className="font-extrabold text-neutral-800 truncate pr-2 max-w-[150px]">
                                    {it.name} <span className="text-primary font-extrabold">x{it.quantity}</span>
                                  </span>
                                  <span className="font-bold text-neutral-600 shrink-0">
                                    Rp {new Intl.NumberFormat('id-ID').format(it.price * it.quantity)}
                                  </span>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-dashed border-neutral-200 flex justify-between items-center text-xs font-extrabold text-neutral-800">
                                <span>Total Pembayaran</span>
                                <span className="text-primary">
                                  Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Courier Setup & AWB */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Informasi Logistik</h4>
                            
                            {isEditingCourier ? (
                              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-200 space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-neutral-500 block">Pilih Kurir Koperasi</label>
                                  <select
                                    value={tempCourierName}
                                    onChange={(e) => setTempCourierName(e.target.value)}
                                    className="w-full bg-white border border-neutral-200 outline-none p-1.5 text-xs font-bold rounded-lg text-neutral-800"
                                  >
                                    <option value="Slamet (Kurir Kopdes)">Slamet (Kurir Kopdes)</option>
                                    <option value="Andi (Kurir Kopdes)">Andi (Kurir Kopdes)</option>
                                    <option value="Budi (Kurir Kopdes)">Budi (Kurir Kopdes)</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-neutral-500 block">Nomor Resi / AWB</label>
                                  <input
                                    type="text"
                                    value={tempAwbNumber}
                                    onChange={(e) => setTempAwbNumber(e.target.value)}
                                    className="w-full bg-white border border-neutral-200 outline-none p-1.5 text-xs font-bold rounded-lg text-neutral-800 font-mono uppercase"
                                  />
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={handleSaveCourierChanges}
                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-all border-none cursor-pointer"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    onClick={() => setEditingOrderCourierId(null)}
                                    className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-[10px] rounded-lg transition-all border-none cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 space-y-2 flex flex-col justify-between h-[115px]">
                                <div>
                                  <p className="text-xs text-neutral-700">
                                    Kurir: <strong className="text-neutral-800">{order.courier}</strong>
                                  </p>
                                  <p className="text-xs text-neutral-700 mt-1 flex items-center gap-1">
                                    Resi: <strong className="text-neutral-800 font-mono tracking-wider">{order.awb}</strong>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.awb);
                                        setCopiedAwb(order.awb);
                                        setTimeout(() => setCopiedAwb(null), 1500);
                                      }}
                                      className="p-1 hover:bg-neutral-200 rounded text-neutral-500 cursor-pointer border-none bg-transparent flex items-center"
                                      title="Salin Resi"
                                    >
                                      <span className="material-symbols-outlined text-xs">
                                        {copiedAwb === order.awb ? 'done' : 'content_copy'}
                                      </span>
                                    </button>
                                  </p>
                                </div>

                                <button
                                  onClick={handleStartEditCourier}
                                  className="w-full py-1.5 hover:bg-neutral-100 text-neutral-600 hover:text-black font-bold text-[10px] rounded-lg transition-all border border-neutral-200 bg-white cursor-pointer flex justify-center items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">edit</span>
                                  <span>Ubah Kurir / Resi</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* MODAL: Tambah Anggota */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fffbff] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#d8c2c2]/30">
              <h3 className="text-lg font-bold text-[#201a1a]">Tambah Anggota Baru</h3>
              <button
                onClick={() => setIsNewMemberModalOpen(false)}
                className="material-symbols-outlined text-neutral-500 hover:text-black cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Kurniawan"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Username Sistem</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: andik"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Password Sistem</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password anggota"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Setoran Simpanan Awal (Rp)</label>
                <input
                  type="number"
                  min="500000"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newMemberBalance}
                  onChange={(e) => setNewMemberBalance(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-[#a31d22] transition-colors cursor-pointer"
                >
                  Daftarkan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Tambah Produk */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fffbff] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#d8c2c2]/30">
              <h3 className="text-lg font-bold text-[#201a1a]">Tambah Produk Baru</h3>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="material-symbols-outlined text-neutral-500 hover:text-black cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Rojo Lele 5kg"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="65000"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Kategori Produk</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none bg-white focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                >
                  <option value="Sembako">Sembako</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Pupuk & Tani">Pupuk & Tani</option>
                  <option value="Peralatan Rumah">Peralatan Rumah</option>
                  <option value="Lainnya">Lainnya (Ketik kustom)</option>
                </select>
              </div>

              {newProdCategory === 'Lainnya' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8b7474] ml-1">Ketik Kategori Kustom</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Alat Tulis Kantor"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Kuantitas Stok Awal</label>
                <input
                  type="number"
                  required
                  placeholder="100"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-[#a31d22] transition-colors cursor-pointer"
                >
                  Tambahkan SKU
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE / UBAH PROFIL */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fffbff] rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl space-y-6 border border-neutral-100"
          >
            <div className="flex justify-between items-center border-b border-[#d8c2c2]/20 pb-4">
              <h3 className="text-lg font-extrabold text-[#201a1a] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_edit</span>
                Ubah Profil Super Admin
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full neumorphic-elevated p-1 overflow-hidden relative bg-white">
                  <img
                    alt="Pratinjau Avatar"
                    className="w-full h-full object-cover rounded-full"
                    src={profileAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-primary uppercase bg-[#fffbff] px-2.5 py-1 rounded-full border border-neutral-100 shadow-sm">
                  Pratinjau Avatar
                </span>
              </div>

              {/* Input Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8b7474] ml-1">Nama Lengkap</label>
                <div className="neumorphic-inset flex items-center px-4 py-3 rounded-xl bg-[#fdfbfc]">
                  <span className="material-symbols-outlined text-neutral-400 mr-2.5 text-lg">badge</span>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Anda"
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-semibold text-[#201a1a]"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
              </div>

              {/* Preset Avatar Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8b7474] ml-1">Pilih Preset Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
                  ].map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileAvatar(url)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all p-0.5 cursor-pointer bg-white flex items-center justify-center ${
                        profileAvatar === url ? 'border-primary scale-110 shadow-md' : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-full" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Avatar URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8b7474] ml-1">Link Avatar Kustom (URL Gambar)</label>
                <div className="neumorphic-inset flex items-center px-4 py-2 rounded-xl bg-[#fdfbfc]">
                  <span className="material-symbols-outlined text-neutral-400 mr-2.5 text-lg">link</span>
                  <input
                    type="url"
                    placeholder="https://example.com/foto.jpg"
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs text-[#201a1a]"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold text-xs border-none hover:bg-neutral-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs border-none hover:bg-[#a31d22] transition-colors cursor-pointer shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Edit Anggota */}
      {isEditMemberModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fffbff] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#d8c2c2]/30">
              <h3 className="text-lg font-bold text-[#201a1a]">Edit Data Anggota</h3>
              <button
                onClick={() => {
                  setIsEditMemberModalOpen(false);
                  setEditingMember(null);
                }}
                className="material-symbols-outlined text-neutral-500 hover:text-black cursor-pointer bg-transparent border-none"
              >
                close
              </button>
            </div>

            <form onSubmit={handleEditMemberSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Kurniawan"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Username Sistem</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: andik"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={editMemberUsername}
                  onChange={(e) => setEditMemberUsername(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Password Baru (Kosongkan jika tidak diubah)</label>
                <input
                  type="password"
                  placeholder="Masukkan password baru jika ingin diubah"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={editMemberPassword}
                  onChange={(e) => setEditMemberPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Saldo Simpanan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={editMemberBalance}
                  onChange={(e) => setEditMemberBalance(parseFloat(e.target.value) || 0)}
                />
              </div>

              {editingMember.role === 'member' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8b7474] ml-1">Pinjaman Aktif Saat Ini (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                    value={editMemberActiveLoan}
                    onChange={(e) => setEditMemberActiveLoan(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Role Anggota</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none bg-white focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value as 'member' | 'admin')}
                >
                  <option value="member">MEMBER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMemberModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="flex-1 py-3 bg-neutral-100 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-[#a31d22] transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Edit Produk */}
      {isEditStockModalOpen && editingStock && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fffbff] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#d8c2c2]/30">
              <h3 className="text-lg font-bold text-[#201a1a]">Edit Detail Produk</h3>
              <button
                onClick={() => {
                  setIsEditStockModalOpen(false);
                  setEditingStock(null);
                }}
                className="material-symbols-outlined text-neutral-500 hover:text-black cursor-pointer bg-transparent border-none"
              >
                close
              </button>
            </div>

            <form onSubmit={handleEditStockSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Rojo Lele 5kg"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="65000"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={editProdPrice}
                  onChange={(e) => setEditProdPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Kategori Produk</label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none bg-white focus:ring-2 focus:ring-primary/20 text-sm font-semibold"
                  value={editProdCategory}
                  onChange={(e) => setEditProdCategory(e.target.value)}
                >
                  <option value="Sembako">Sembako</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Pupuk & Tani">Pupuk & Tani</option>
                  <option value="Peralatan Rumah">Peralatan Rumah</option>
                  <option value="Lainnya">Lainnya (Ketik kustom)</option>
                </select>
              </div>

              {editProdCategory === 'Lainnya' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8b7474] ml-1">Ketik Kategori Kustom</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Alat Tulis Kantor"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b7474] ml-1">Sisa Stok Unit</label>
                <input
                  type="number"
                  required
                  placeholder="100"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-primary/20"
                  value={editProdStock}
                  onChange={(e) => setEditProdStock(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStockModalOpen(false);
                    setEditingStock(null);
                  }}
                  className="flex-1 py-3 bg-neutral-100 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-[#a31d22] transition-colors cursor-pointer"
                >
                  Simpan Detail SKU
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
