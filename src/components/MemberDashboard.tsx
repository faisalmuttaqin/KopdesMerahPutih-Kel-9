import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Member, StockItem, Transaction, RecentActivity, CartItem, LoanApplication } from '../types';

interface MemberDashboardProps {
  currentUser: Member;
  loans: LoanApplication[];
  stock: StockItem[];
  transactions: Transaction[];
  activities: RecentActivity[];
  onLogout: () => void;
  onUpdateDatabase: (updatedData: {
    members?: Member[];
    loans?: LoanApplication[];
    stock?: StockItem[];
    transactions?: Transaction[];
    activities?: RecentActivity[];
  }) => void;
  onSwitchView: (view: 'dashboard' | 'loan-calculator') => void;
  members: Member[];
}

const parseLoanDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('-') || dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  try {
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10) || 1;
      const monthStr = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10) || new Date().getFullYear();
      
      const monthsIndo: Record<string, number> = {
        jan: 0, januari: 0, okt: 9, oktober: 9,
        feb: 1, februari: 1, nov: 10, november: 10,
        mar: 2, maret: 2, des: 11, desember: 11,
        apr: 3, april: 3,
        mei: 4,
        jun: 5, juni: 5,
        jul: 6, juli: 6,
        ags: 7, agustus: 7, agt: 7,
        sep: 8, september: 8
      };
      
      const month = monthsIndo[monthStr] !== undefined ? monthsIndo[monthStr] : 0;
      return new Date(year, month, day);
    }
  } catch (e) {
    // fallback
  }
  return new Date();
};

const getDueDateForMonth = (baseDateStr: string, monthIdx: number): { dateStr: string; status: 'LUNAS' | 'TERLAMBAT' | 'MENUNGGU' | 'JATUH_TEMPO_HARI_INI'; daysDiffText: string } => {
  const baseDate = parseLoanDate(baseDateStr);
  const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  
  dueDate.setMonth(baseDate.getMonth() + monthIdx);
  dueDate.setDate(25);
  
  const today = new Date();
  const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d2 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formattedDate = dueDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let status: 'LUNAS' | 'TERLAMBAT' | 'MENUNGGU' | 'JATUH_TEMPO_HARI_INI' = 'MENUNGGU';
  let daysDiffText = '';

  if (diffDays === 0) {
    status = 'JATUH_TEMPO_HARI_INI';
    daysDiffText = 'Hari ini!';
  } else if (diffDays < 0) {
    status = 'TERLAMBAT';
    const absDays = Math.abs(diffDays);
    if (absDays >= 365) {
      const yrs = Math.floor(absDays / 365);
      daysDiffText = `Terlambat ${yrs} tahun`;
    } else if (absDays >= 30) {
      const mths = Math.floor(absDays / 30);
      daysDiffText = `Terlambat ${mths} bulan`;
    } else {
      daysDiffText = `Terlambat ${absDays} hari`;
    }
  } else {
    status = 'MENUNGGU';
    if (diffDays >= 365) {
      const yrs = Math.floor(diffDays / 365);
      daysDiffText = `${yrs} tahun lagi`;
    } else if (diffDays >= 30) {
      const mths = Math.floor(diffDays / 30);
      daysDiffText = `${mths} bulan lagi`;
    } else {
      daysDiffText = `${diffDays} hari lagi`;
    }
  }

  return {
    dateStr: formattedDate,
    status,
    daysDiffText
  };
};

export default function MemberDashboard({
  currentUser,
  loans,
  stock,
  transactions,
  activities,
  onLogout,
  onUpdateDatabase,
  onSwitchView,
  members,
}: MemberDashboardProps) {
  const coopName = localStorage.getItem('kopdes_coop_name') || 'Koperasi Desa Merah Putih';
  const interestRate = parseFloat(localStorage.getItem('kopdes_interest_rate') || '1.5');
  const interestMultiplier = interestRate / 100;

  // Find buddy's specific personal loan (defined at top to initialize states correctly)
  const personalLoans = (loans || []).filter((l) => l && l.memberId === currentUser?.id);
  const activePersonalLoan = personalLoans.find((l) => l?.status === 'approved') || personalLoans[0];

  const getInitialPaidMonths = () => {
    if (!activePersonalLoan) return 0;
    return activePersonalLoan.paidMonths !== undefined
      ? activePersonalLoan.paidMonths
      : (activePersonalLoan.id === 'loan-1' ? 7 : 0);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000000);
  const [isShopActive, setIsShopActive] = useState(false);
  const [isAngsuranActive, setIsAngsuranActive] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [orders, setOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('kopdes_orders');
    if (saved) return JSON.parse(saved);
    const initialOrders = [
      {
        id: "ord-1",
        memberId: "budi",
        items: [
          { name: "Beras Premium 5kg", quantity: 1, price: 65000 },
          { name: "Minyak Goreng 2L", quantity: 1, price: 34000 }
        ],
        totalAmount: 99000,
        date: "28 Juni 2026",
        status: "Tiba di Tujuan",
        awb: "KOP-MP-98231",
        courier: "Kurir Koperasi (Slamet)",
        history: [
          { status: "Tiba di Tujuan", date: "28 Juni 2026 15:30", description: "Pesanan telah diterima oleh Budi Santoso (Ybs)." },
          { status: "Dikirim", date: "28 Juni 2026 11:15", description: "Pesanan sedang dalam pengiriman oleh Kurir Slamet." },
          { status: "Diproses", date: "28 Juni 2026 09:00", description: "Pesanan telah dikonfirmasi dan sedang dikemas di gudang koperasi." }
        ]
      }
    ];
    localStorage.setItem('kopdes_orders', JSON.stringify(initialOrders));
    return initialOrders;
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string>("ord-1");
  const [isSyncingGps, setIsSyncingGps] = useState(false);
  const [syncGpsText, setSyncGpsText] = useState('');
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [paidMonths, setPaidMonths] = useState(getInitialPaidMonths);

  // Real-time localStorage Sync for Orders (to reflect Admin updates instantly)
  useEffect(() => {
    if (!isTrackingActive) return;
    const interval = setInterval(() => {
      const saved = localStorage.getItem('kopdes_orders');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setOrders(parsed);
        } catch (e) {
          console.error(e);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isTrackingActive]);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'trend' | 'allocation' | 'cashflow'>('trend');
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [modalTxTypeFilter, setModalTxTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [isInstallmentConfirmModalOpen, setIsInstallmentConfirmModalOpen] = useState(false);
  const [modalAlertMessage, setModalAlertMessage] = useState<{title: string, message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [angsuranTab, setAngsuranTab] = useState<'schedule' | 'history'>('schedule');

  // Edit Profile States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isCheckoutConfirmModalOpen, setIsCheckoutConfirmModalOpen] = useState(false);
  const [isDeliveryConfirmModalOpen, setIsDeliveryConfirmModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatarUrl || '');

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileAvatar(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

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

  // Dynamic shopping cart state
  const [cart, setCart] = useState<CartItem[]>([
    { id: 'stock-1', name: 'Beras Premium 5kg', price: 65000, quantity: 1 },
    { id: 'stock-2', name: 'Minyak Goreng 2L', price: 34000, quantity: 2 },
  ]);

  // Adjust cart quantity
  const handleUpdateCartQty = (id: string, delta: number) => {
    const originalProduct = (stock || []).find((s) => s.id === id);
    const maxStock = originalProduct ? originalProduct.stock : 99999;
    
    let exceeded = false;
    const updated = cart
      .map((item) => {
        if (item.id === id) {
          const qty = item.quantity + delta;
          if (qty > maxStock) {
            exceeded = true;
            alert(`Maaf, Anda tidak dapat membeli melebihi batas stok. Stok untuk ${item.name} hanya tersedia ${maxStock} unit.`);
            return item;
          }
          return { ...item, quantity: qty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    
    if (!exceeded) {
      setCart(updated);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
  };

  const cartTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  // Top Up Action
  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;

    // Update member's balance
    const updatedMembers = members.map((m) =>
      m.id === currentUser.id ? { ...m, balance: m.balance + topUpAmount } : m
    );

    // Create a transaction log
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      description: 'Top Up Simpanan Sukarela',
      date: 'Hari ini',
      amount: topUpAmount,
      type: 'in',
      icon: 'add',
      color: 'text-emerald-600',
    };

    // Create recent activity log
    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'deposit',
      title: 'Top Up Berhasil',
      description: `${currentUser.name} meningkatkan simpanan sukarela sebesar Rp ${new Intl.NumberFormat('id-ID').format(topUpAmount)}.`,
      time: 'Baru saja',
      color: 'text-emerald-700',
      icon: 'payments',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      members: updatedMembers,
      transactions: [newTx, ...transactions],
      activities: [newActivity, ...activities],
    });

    setIsTopUpModalOpen(false);
    alert(`Top up sukses sebesar Rp ${new Intl.NumberFormat('id-ID').format(topUpAmount)}!`);
  };

  // Submit Order / Checkout Pre-Check (opens confirmation modal)
  const handleCheckoutPreCheck = () => {
    if (cart.length === 0) {
      setModalAlertMessage({
        title: 'Keranjang Kosong',
        message: 'Keranjang belanja Anda masih kosong. Silakan pilih produk terlebih dahulu.',
        type: 'info'
      });
      return;
    }

    // Verify stock availability
    for (const cartItem of cart) {
      const match = stock.find((s) => s.id === cartItem.id);
      if (match && cartItem.quantity > match.stock) {
        setModalAlertMessage({
          title: 'Stok Tidak Cukup',
          message: `Gagal checkout: Pembelian barang ${cartItem.name} sebanyak ${cartItem.quantity} pcs melebihi stok yang tersedia (${match.stock} pcs). Silakan sesuaikan keranjang belanja Anda.`,
          type: 'error'
        });
        return;
      }
    }

    if (currentUser.balance < cartTotal) {
      setModalAlertMessage({
        title: 'Saldo Tidak Cukup',
        message: `Maaf, saldo simpanan Anda (Rp ${new Intl.NumberFormat('id-ID').format(currentUser.balance)}) tidak mencukupi untuk pembayaran belanja ini sebesar Rp ${new Intl.NumberFormat('id-ID').format(cartTotal)}.`,
        type: 'error'
      });
      return;
    }

    // All checks pass! Open beautiful Shopee-style Checkout Confirmation modal
    setIsCheckoutConfirmModalOpen(true);
  };

  const executeCheckout = () => {
    setIsCheckoutConfirmModalOpen(false);

    // Subtract stock quantity in the database safely
    const updatedStock = stock.map((s) => {
      const cartMatch = cart.find((c) => c.id === s.id);
      if (cartMatch) {
        return { ...s, stock: Math.max(0, s.stock - cartMatch.quantity) };
      }
      return s;
    });

    // Subtract member's balance
    const updatedMembers = members.map((m) =>
      m.id === currentUser.id ? { ...m, balance: m.balance - cartTotal } : m
    );

    // Log transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      description: `Belanja Toko (${cart.map((c) => c.name).join(', ')})`,
      date: 'Hari ini',
      amount: cartTotal,
      type: 'out',
      icon: 'remove',
      color: 'text-rose-600',
    };

    // Log activity
    const newActivity: RecentActivity = {
      id: `act-${Date.now()}`,
      type: 'purchase',
      title: 'Pembelian Sembako',
      description: `${currentUser.name} berbelanja senilai Rp ${new Intl.NumberFormat('id-ID').format(cartTotal)} di koperasi.`,
      time: 'Baru saja',
      color: 'text-rose-700',
      icon: 'shopping_bag',
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase({
      stock: updatedStock,
      members: updatedMembers,
      transactions: [newTx, ...transactions],
      activities: [newActivity, ...activities],
    });

    // Create live order for delivery tracking
    const newOrderId = `ord-${Date.now()}`;
    const newOrder = {
      id: newOrderId,
      memberId: currentUser.id,
      items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
      totalAmount: cartTotal,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: "Diproses",
      awb: `KOP-MP-${Date.now().toString().slice(-5)}`,
      courier: "Kurir Koperasi (Andi)",
      history: [
        {
          status: "Diproses",
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + " " + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          description: "Pesanan berhasil dibuat, pembayaran diverifikasi, dan sedang dikemas di gudang koperasi."
        }
      ]
    };
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    setSelectedOrderId(newOrderId);
    localStorage.setItem('kopdes_orders', JSON.stringify(updatedOrders));

    setCart([]);
    
    // Auto switch to tracking view!
    setIsShopActive(false);
    setIsAngsuranActive(false);
    setIsTrackingActive(true);

    setModalAlertMessage({
      title: 'Pemesanan Berhasil!',
      message: 'Pesanan Anda berhasil dibuat dan diteruskan ke petugas Koperasi! Status saat ini sedang dikemas dan diproses.',
      type: 'success'
    });
  };

  // Switch specifically to store list tab if they want to click Jual/Beli
  const [selectedProductCategory, setSelectedProductCategory] = useState<'All' | 'Sembako' | 'Minuman'>('All');

  const filteredProducts = stock.filter((p) => {
    if (selectedProductCategory === 'All') return true;
    return p.category === selectedProductCategory;
  });

  const handleAddToCart = (product: StockItem) => {
    const currentProduct = (stock || []).find((s) => s.id === product.id) || product;
    const existing = cart.find((c) => c.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + 1 > currentProduct.stock) {
      alert(`Maaf, Anda tidak dapat membeli melebihi batas stok. Stok untuk ${currentProduct.name} hanya tersedia ${currentProduct.stock} unit.`);
      return;
    }

    if (existing) {
      handleUpdateCartQty(product.id, 1);
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  // useEffect to synchronize paidMonths state when active loan changes
  useEffect(() => {
    if (activePersonalLoan) {
      const defaultPaid = activePersonalLoan.paidMonths !== undefined
        ? activePersonalLoan.paidMonths
        : (activePersonalLoan.id === 'loan-1' ? 7 : 0);
      setPaidMonths(defaultPaid);
    } else {
      setPaidMonths(0);
    }
  }, [activePersonalLoan?.id, activePersonalLoan?.paidMonths]);

  // Dynamic loan progress calculations
  const actualTenor = activePersonalLoan?.tenor || 24;
  const safePaidMonths = Math.min(paidMonths, actualTenor);
  const progressPercent = activePersonalLoan ? Math.round((safePaidMonths / actualTenor) * 100) : 0;
  const remainingLoanAmount = activePersonalLoan
    ? Math.max(0, activePersonalLoan.amount * (1 - safePaidMonths / actualTenor))
    : 0;

  // Dynamic financial chart calculations
  const totalBalance = currentUser.balance;
  const pokokAmount = Math.min(totalBalance * 0.1, 1500000);
  const wajibAmount = Math.min(totalBalance * 0.35, 10000000);
  const sukarelaAmount = Math.max(0, totalBalance - pokokAmount - wajibAmount);

  const allocationData = [
    { name: 'Simpanan Pokok', value: pokokAmount, color: '#ce2029' },
    { name: 'Simpanan Wajib', value: wajibAmount, color: '#f59e0b' },
    { name: 'Simpanan Sukarela', value: sukarelaAmount, color: '#10b981' },
  ];

  // 6 Months dynamic savings history
  const savingsHistory = [
    { month: 'Mei', Saldo: Math.round(totalBalance * 0.81) },
    { month: 'Jun', Saldo: Math.round(totalBalance * 0.85) },
    { month: 'Jul', Saldo: Math.round(totalBalance * 0.88) },
    { month: 'Agu', Saldo: Math.round(totalBalance * 0.92) },
    { month: 'Sep', Saldo: Math.round(totalBalance * 0.96) },
    { month: 'Okt', Saldo: totalBalance },
  ];

  // Cashflow history with actual transactions integration
  const inflowThisMonth = transactions
    .filter((t) => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const outflowThisMonth = transactions
    .filter((t) => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashflowHistory = [
    { month: 'Agu', Masuk: 1250000, Keluar: 800000 },
    { month: 'Sep', Masuk: 2100000, Keluar: 1400000 },
    { month: 'Okt', Masuk: 500000 + inflowThisMonth, Keluar: 250000 + outflowThisMonth },
  ];

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#241b1b] font-sans antialiased flex flex-col md:flex-row">
      {/* SideNavBar (Desktop) */}
      <aside className="h-screen w-64 bg-[#fff8f8] shadow-[6px_6px_12px_#D1B8B8] flex flex-col py-6 sticky top-0 shrink-0 hidden md:flex">
        <div className="px-6 mb-8 flex flex-col">
          <img
            alt="Koperasi Desa Merah Putih Logo"
            className="h-14 w-auto object-contain mb-1 self-start"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBesQ7DtURo8RyQyK3Vp8Jral0gKBi9uc5m1kZD5l6JrU9tdsamqGxe-QmA53WlSCyzR2p5bCh120hrE5ZCRoawDJXekGphDQR8tPYNHEGjjuLUTYBMMxrtL-hcTpI7ZZOXv_wEZzZHmivoednfrZBp24L1uCfWsJoREfuN24z5e8Rgb6rnOMLOWzTNBTGN7zWrJQw2c2WR4esxlwsI1jV0-juXxlz0p2cSAA1a2s1J7K9iK6jFvD_zKoitSNZaVEMOfB1sH_MQkI4"
          />
          <p className="text-[10px] font-bold text-[#877575] uppercase tracking-widest">
            Management Portal
          </p>
        </div>

        <nav className="flex-grow px-2 space-y-1">
          <button
            onClick={() => {
              setIsShopActive(false);
              setIsAngsuranActive(false);
              setIsTrackingActive(false);
            }}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-transform duration-100 ${
              (!isShopActive && !isAngsuranActive && !isTrackingActive)
                ? 'bg-[#fff8f8] shadow-[inset_4px_4px_8px_#D1B8B8,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#877575] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#D1B8B8] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => {
              setIsShopActive(true);
              setIsAngsuranActive(false);
              setIsTrackingActive(false);
            }}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-transform duration-100 ${
              isShopActive
                ? 'bg-[#fff8f8] shadow-[inset_4px_4px_8px_#D1B8B8,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#877575] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#D1B8B8] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">shopping_bag</span>
            <span className="text-sm">Koperasi Shop</span>
          </button>

          <button
            onClick={() => {
              setIsShopActive(false);
              setIsAngsuranActive(false);
              setIsTrackingActive(true);
            }}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-transform duration-100 ${
              isTrackingActive
                ? 'bg-[#fff8f8] shadow-[inset_4px_4px_8px_#D1B8B8,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#877575] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#D1B8B8] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">local_shipping</span>
            <span className="text-sm">Tracking Pengiriman</span>
          </button>

          <button
            onClick={() => {
              setIsShopActive(false);
              setIsAngsuranActive(true);
              setIsTrackingActive(false);
            }}
            className={`w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 transition-transform duration-100 ${
              isAngsuranActive
                ? 'bg-[#fff8f8] shadow-[inset_4px_4px_8px_#D1B8B8,inset_-4px_-4px_8px_#FFFFFF] text-primary scale-95'
                : 'text-[#877575] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#D1B8B8] hover:text-primary rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined mr-3">receipt_long</span>
            <span className="text-sm">Angsuran & Tagihan</span>
          </button>

          <button
            onClick={() => onSwitchView('loan-calculator')}
            className="w-full text-left font-semibold rounded-xl flex items-center px-4 py-3 text-[#877575] hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#D1B8B8] hover:text-primary transition-all text-sm"
          >
            <span className="material-symbols-outlined mr-3">account_balance</span>
            <span>Pinjaman Baru</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-[#d8c4c4] pt-4 px-2 space-y-1">
          {/* Quick simulation link back to Admin */}
          <div className="px-4 py-2 bg-red-50 rounded-xl mx-2 mb-2">
            <span className="text-[10px] text-red-600 font-bold block mb-1">SIMULATOR LINK:</span>
            <button
              onClick={() => onLogout()}
              className="text-xs font-semibold text-red-800 hover:underline flex items-center gap-1 cursor-pointer w-full text-left"
            >
              <span className="material-symbols-outlined text-xs">shield_person</span>
              Masuk Admin Utama
            </button>
          </div>

          <button
            onClick={() => alert('Pusat Bantuan Anggota: Silakan hubungi support@kopdesmerahputih.id')}
            className="w-full text-left text-[#877575] font-semibold rounded-xl flex items-center px-4 py-2.5 hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#D1B8B8] hover:text-primary transition-all text-sm"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            <span>Bantuan</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full text-left text-red-600 font-bold rounded-xl flex items-center px-4 py-2.5 hover:shadow-[-2px_-2px_5px_#FFFFFF,2px_2px_5px_#D1B8B8] hover:bg-red-50 transition-all text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* TopNavBar */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-[#fff8f8]/95 backdrop-blur-sm shadow-[0_4px_12px_-4px_rgba(209,184,184,0.3)] flex justify-between items-center px-8 py-4 w-full">
          <div className="flex items-center gap-4">
            <button className="md:hidden neumorphic-elevated-red p-2 rounded-xl text-primary">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <img
                alt="Logo"
                className="h-10 w-auto md:hidden"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBesQ7DtURo8RyQyK3Vp8Jral0gKBi9uc5m1kZD5l6JrU9tdsamqGxe-QmA53WlSCyzR2p5bCh120hrE5ZCRoawDJXekGphDQR8tPYNHEGjjuLUTYBMMxrtL-hcTpI7ZZOXv_wEZzZHmivoednfrZBp24L1uCfWsJoREfuN24z5e8Rgb6rnOMLOWzTNBTGN7zWrJQw2c2WR4esxlwsI1jV0-juXxlz0p2cSAA1a2s1J7K9iK6jFvD_zKoitSNZaVEMOfB1sH_MQkI4"
              />
              <span className="text-lg md:text-xl font-extrabold text-primary font-headline-md tracking-tight">
                {coopName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex neumorphic-inset-red px-4 py-2 rounded-full items-center gap-3">
              <span className="material-symbols-outlined text-[#877575]">search</span>
              <input
                className="bg-transparent border-none outline-none focus:ring-0 text-sm w-44"
                placeholder="Cari transaksi..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => alert('Tidak ada pemberitahuan baru hari ini.')}
                className="neumorphic-elevated-red p-2 rounded-full text-[#877575] hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              </button>
              <button
                onClick={() => setIsShopActive(!isShopActive)}
                className="neumorphic-elevated-red p-2 rounded-full text-[#877575] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
              </button>
              <button
                onClick={() => setIsEditProfileModalOpen(true)}
                title="Ubah Nama & Profil"
                className="w-10 h-10 rounded-full neumorphic-elevated-red overflow-hidden border-2 border-[#fff8f8] ml-2 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all focus:outline-none"
              >
                <img
                  alt="User profile avatar"
                  className="w-full h-full object-cover"
                  src={currentUser.avatarUrl}
                />
              </button>
            </div>
          </div>
        </header>

        {/* Outer Dashboard Content */}
        {!isShopActive && !isAngsuranActive && !isTrackingActive ? (
          <main className="p-8 flex-grow">
            {/* Dynamic Greeting */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-neutral-800">
                  Halo, {currentUser.name}!
                </h2>
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  title="Ubah Nama / Profil"
                  className="p-1.5 rounded-full text-[#877575] hover:text-primary hover:bg-[#fff0f0] transition-all cursor-pointer inline-flex items-center justify-center border-none bg-transparent"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
              <p className="text-sm md:text-base text-[#554545] mt-1">
                Selamat datang kembali. Mari kelola keuangan bersama kami hari ini.
              </p>
            </div>

            {/* Main Area Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Balance & Tx card Left Area */}
              <div className="lg:col-span-8 space-y-6">
                {/* Balance & Analytics Card Section */}
                <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[32px] p-6 lg:p-8 relative overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left Panel: Balance & Actions */}
                    <div className="md:col-span-5 flex flex-col justify-between min-h-[180px] z-10">
                      <div>
                        <span className="text-xs font-semibold text-[#554545] opacity-70 block uppercase tracking-wider">
                          Saldo Simpanan Anda
                        </span>
                        <h3 className="text-2xl md:text-2xl lg:text-3xl font-extrabold text-[#241b1b] mt-3">
                          Rp {new Intl.NumberFormat('id-ID').format(currentUser.balance)}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="flex items-center gap-1 text-[#006d3c] font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-xs">
                            <span className="material-symbols-outlined text-xs">trending_up</span>
                            +2.4% Bulan ini
                          </span>
                        </div>
                        <span className="text-[10px] text-[#554545] opacity-60 mt-2 block font-medium">
                          Terakhir diperbarui: 10:45 AM
                        </span>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2.5">
                        <button
                          onClick={() => setIsTopUpModalOpen(true)}
                          className="neumorphic-elevated-red bg-primary text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          <span>Tambah Saldo</span>
                        </button>
                        <button
                          onClick={() => alert(`Rincian detail: Simpanan Pokok: Rp 20.000 (Setoran Awal), Simpanan Wajib: Rp 50.000/bln, Sisa Saldo: Simpanan Sukarela Rp ${new Intl.NumberFormat('id-ID').format(currentUser.balance - 1000000)}`)}
                          className="neumorphic-elevated-red bg-[#fff8f8] text-primary text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">history</span>
                          <span>Detail</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Panel: Integrated Chart Panel */}
                    <div className="md:col-span-7 bg-[#fffcfc] p-4 rounded-2xl border border-[#d8c4c4]/20 shadow-[inset_1.5px_1.5px_4px_#D1B8B8] z-10 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold text-neutral-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-xs">analytics</span>
                          Analisis & Grafik
                        </span>

                        {/* Miniature Chart Tab switch */}
                        <div className="flex p-0.5 bg-white/40 rounded-xl shadow-[inset_0.5px_0.5px_2px_#D1B8B8] gap-0.5 border border-[#d8c4c4]/20">
                          {(['trend', 'allocation', 'cashflow'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveChartTab(tab)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                                activeChartTab === tab
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'text-[#877575] hover:text-primary'
                              }`}
                            >
                              {tab === 'trend' ? 'Tren' : tab === 'allocation' ? 'Alokasi' : 'Arus Kas'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rendered Chart */}
                      <div className="h-[120px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          {activeChartTab === 'trend' ? (
                            <AreaChart data={savingsHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ce2029" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#ce2029" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8c4c4" strokeOpacity={0.15} />
                              <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                stroke="#877575"
                                fontSize={9}
                                fontWeight="600"
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                stroke="#877575"
                                fontSize={9}
                                fontWeight="600"
                                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}Jt`}
                              />
                              <Tooltip
                                formatter={(value) => [
                                  `Rp ${new Intl.NumberFormat('id-ID').format(value as number)}`,
                                  'Saldo',
                                ]}
                                contentStyle={{
                                  background: '#fff8f8',
                                  border: '1px solid #d8c4c4',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="Saldo"
                                stroke="#ce2029"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorSaldo)"
                              />
                            </AreaChart>
                          ) : activeChartTab === 'allocation' ? (
                            <PieChart>
                              <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={45}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {allocationData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  `Rp ${new Intl.NumberFormat('id-ID').format(value as number)}`,
                                  'Jumlah',
                                ]}
                                contentStyle={{
                                  background: '#fff8f8',
                                  border: '1px solid #d8c4c4',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                }}
                              />
                            </PieChart>
                          ) : (
                            <BarChart data={cashflowHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8c4c4" strokeOpacity={0.15} />
                              <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                stroke="#877575"
                                fontSize={9}
                                fontWeight="600"
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                stroke="#877575"
                                fontSize={9}
                                fontWeight="600"
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}Jt`}
                              />
                              <Tooltip
                                formatter={(value) => [
                                  `Rp ${new Intl.NumberFormat('id-ID').format(value as number)}`,
                                ]}
                                contentStyle={{
                                  background: '#fff8f8',
                                  border: '1px solid #d8c4c4',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                }}
                              />
                              <Bar dataKey="Masuk" fill="#10b981" radius={[3, 3, 0, 0]} barSize={8} name="Kas Masuk" />
                              <Bar dataKey="Keluar" fill="#ce2029" radius={[3, 3, 0, 0]} barSize={8} name="Kas Keluar" />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>

                      {/* Micro insight line */}
                      <div className="mt-2 pt-2 border-t border-[#d8c4c4]/20 flex items-center justify-between text-[10px] text-[#554545] font-semibold">
                        {activeChartTab === 'trend' && (
                          <span>Rata-rata kenaikan saldo sukarela <strong className="text-emerald-700">~3.2%</strong> per bulan.</span>
                        )}
                        {activeChartTab === 'allocation' && (
                          <div className="flex gap-2 py-0.5 scrollbar-none overflow-x-auto w-full">
                            {allocationData.map((item) => (
                              <div key={item.name} className="flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="opacity-80">{item.name.replace('Simpanan ', '')}:</span>
                                <span>{Math.round((item.value / totalBalance) * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {activeChartTab === 'cashflow' && (
                          <span>Masuk <strong className="text-emerald-700">Rp {new Intl.NumberFormat('id-ID').format(inflowThisMonth)}</strong> | Keluar <strong className="text-red-700">Rp {new Intl.NumberFormat('id-ID').format(outflowThisMonth)}</strong></span>
                        )}
                      </div>
                    </div>

                  </div>
                </section>
 
                {/* Transaction History Section */}
                <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[32px] p-6 lg:p-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-base font-extrabold text-neutral-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary">history</span>
                      Riwayat Transaksi Pribadi
                    </h4>
                    <button
                      onClick={() => setIsAllTransactionsModalOpen(true)}
                      className="text-primary font-bold hover:underline text-xs bg-transparent border-none cursor-pointer"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-[#d8c4c4]">
                          <th className="py-3 px-2 text-xs font-semibold text-[#554545]">Deskripsi</th>
                          <th className="py-3 px-2 text-xs font-semibold text-[#554545]">Tanggal</th>
                          <th className="py-3 px-2 text-xs font-semibold text-[#554545] text-right">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions
                          .filter((t) =>
                            t.description.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((tx) => (
                            <tr
                              key={tx.id}
                              className="border-b border-[#d8c4c4]/20 hover:bg-[#fff1f1]/50 transition-colors"
                            >
                              <td className="py-3 px-2 flex items-center gap-3">
                                <div className="w-8 h-8 neumorphic-inset-red rounded-full flex items-center justify-center shrink-0">
                                  <span className={`material-symbols-outlined text-sm ${tx.color}`}>
                                    {tx.icon === 'add' ? 'add' : tx.icon === 'remove' ? 'remove' : 'payments'}
                                  </span>
                                </div>
                                <span className="font-semibold text-xs md:text-sm">{tx.description}</span>
                              </td>
                              <td className="py-3 px-2 text-[#554545] text-xs font-medium">{tx.date}</td>
                              <td className={`py-3 px-2 text-right font-bold text-xs md:text-sm ${tx.type === 'in' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {tx.type === 'in' ? '+' : '-'} Rp{' '}
                                {new Intl.NumberFormat('id-ID').format(tx.amount)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Quick Actions & Shop Cart Right Area */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div>
                  <h4 className="text-sm font-bold text-[#554545] uppercase tracking-wider mb-3 px-1">
                    Aksi Cepat Anggota
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Action 1 */}
                    <button
                      onClick={() => setIsTopUpModalOpen(true)}
                      className="neumorphic-elevated-red bg-white p-4 rounded-2xl flex items-center gap-4 group hover:bg-[#fff1f1]/30 hover:scale-[1.01] transition-transform text-left cursor-pointer w-full"
                    >
                      <div className="w-12 h-12 neumorphic-inset-red rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl">savings</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-neutral-800">Simpanan Sukarela</p>
                        <p className="text-[11px] text-[#877575]">Setor tunai tabungan sukarela</p>
                      </div>
                    </button>

                    {/* Action 2 */}
                    <button
                      onClick={() => setIsShopActive(true)}
                      className="neumorphic-elevated-red bg-white p-4 rounded-2xl flex items-center gap-4 group hover:bg-[#fff1f1]/30 hover:scale-[1.01] transition-transform text-left cursor-pointer w-full"
                    >
                      <div className="w-12 h-12 neumorphic-inset-red rounded-xl flex items-center justify-center text-secondary shrink-0 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-neutral-800">Jual / Beli Sembako</p>
                        <p className="text-[11px] text-[#877575]">Belanja kebutuhan harian anggota</p>
                      </div>
                    </button>

                    {/* Action 3 */}
                    <button
                      onClick={() => onSwitchView('loan-calculator')}
                      className="neumorphic-elevated-red bg-white p-4 rounded-2xl flex items-center gap-4 group hover:bg-[#fff1f1]/30 hover:scale-[1.01] transition-transform text-left cursor-pointer w-full"
                    >
                      <div className="w-12 h-12 neumorphic-inset-red rounded-xl flex items-center justify-center text-yellow-700 shrink-0 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl">credit_score</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-neutral-800">Pinjaman Baru</p>
                        <p className="text-[11px] text-[#877575]">Ajukan kredit kredit ringan flat {interestRate}%</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Personal Active Loan status bar */}
                <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[32px] p-6">
                  <h4 className="font-bold text-sm text-[#241b1b] uppercase tracking-wider mb-4">
                    Status Pinjaman Saya
                  </h4>

                  {activePersonalLoan ? (
                    <div className="neumorphic-inset-red bg-[#fff8f8] p-5 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-primary bg-red-100 px-2.5 py-1 rounded-full uppercase">
                          {activePersonalLoan.purpose}
                        </span>
                        <span className="text-xs font-semibold text-[#554545]">
                          {activePersonalLoan.status === 'approved' ? `${safePaidMonths} / ${actualTenor} Bulan` : 'Status: PENDING'}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-[#554545] font-semibold">Progres Pelunasan</span>
                            <span>{activePersonalLoan.status === 'approved' ? `${progressPercent}%` : '0%'}</span>
                          </div>
                          <div className="w-full h-4.5 neumorphic-inset-red rounded-full overflow-hidden p-1 bg-neutral-200/50">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-yellow-600 rounded-full transition-all duration-1000"
                              style={{ width: activePersonalLoan.status === 'approved' ? `${progressPercent}%` : '0%' }}
                            ></div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#d8c4c4]/30 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-[#554545] font-semibold uppercase tracking-wider">
                              {activePersonalLoan.status === 'approved' ? 'Sisa Pinjaman' : 'Besaran Pengajuan'}
                            </p>
                            <p className="text-sm font-bold text-[#241b1b] mt-0.5">
                              Rp{' '}
                              {"approved" === 'approved' && activePersonalLoan.status === 'approved'
                                ? new Intl.NumberFormat('id-ID').format(remainingLoanAmount)
                                : new Intl.NumberFormat('id-ID').format(activePersonalLoan.amount)
                              }
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-[#554545] font-semibold uppercase tracking-wider">
                              Jatuh Tempo
                            </p>
                            <p className="text-xs font-bold text-yellow-700 mt-0.5">
                              {activePersonalLoan.status === 'approved' ? '25 tiap bulan' : 'Menunggu Admin'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[#877575] font-medium">
                      Anda belum memiliki rincian pengajuan pinjaman aktif.
                    </div>
                  )}

                  <button
                    onClick={() => alert('Analisa Rasio Kesehatan Kredit: Nilai DSCR Anda adalah 2.1x (SEHAT).')}
                    className="w-full mt-4 neumorphic-elevated-red bg-[#fff8f8] py-3 rounded-2xl text-xs font-bold text-primary flex items-center justify-center gap-1.5 hover:bg-[#fff1f1]/40"
                  >
                    <span className="material-symbols-outlined text-sm">analytics</span>
                    <span>Detail Analisa Kredit</span>
                  </button>
                </section>
              </div>
            </div>
          </main>
        ) : isShopActive ? (
          /* Active Store/Shop View */
          <main className="p-8 flex-grow">
            {/* Header store */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setIsShopActive(false)}
                  className="text-primary text-xs font-bold hover:underline flex items-center mb-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Kembali ke Dashboard
                </button>
                <h2 className="text-xl md:text-2xl font-bold">{coopName} Store</h2>
                <p className="text-xs text-[#554545] mt-1">
                  Belanja murah meriah khusus fungsionaris anggota koperasi. Potong saldo simpanan secara langsung.
                </p>
              </div>

              {/* Categories */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSelectedProductCategory('All')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-transform ${
                    selectedProductCategory === 'All'
                      ? 'bg-primary text-white scale-95 shadow-md'
                      : 'bg-[#fff1f1] text-[#241b1b]'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setSelectedProductCategory('Sembako')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-transform ${
                    selectedProductCategory === 'Sembako'
                      ? 'bg-primary text-white scale-95 shadow-md'
                      : 'bg-[#fff1f1] text-[#241b1b]'
                  }`}
                >
                  Sembako
                </button>
                <button
                  onClick={() => setSelectedProductCategory('Minuman')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-transform ${
                    selectedProductCategory === 'Minuman'
                      ? 'bg-primary text-white scale-95 shadow-md'
                      : 'bg-[#fff1f1] text-[#241b1b]'
                  }`}
                >
                  Pack Minuman
                </button>
              </div>
            </div>

            {/* Shop layout split: Products grid + Shopping Cart Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Product cards */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="neumorphic-elevated-red bg-white rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-[inset_1px_1px_2px_#D1B8B8]">
                        <span className="material-symbols-outlined">shopping_bag</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-neutral-800 line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-[#877575] uppercase mt-0.5 tracking-wider font-semibold">
                        Kategori: {prod.category}
                      </p>
                      <p className="text-neutral-500 text-xs font-medium mt-1">SKU: {prod.sku}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#d8c4c4]/20 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-bold block">Harga Anggota</span>
                        <span className="text-sm font-extrabold text-primary">
                          Rp {new Intl.NumberFormat('id-ID').format(prod.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(prod)}
                        disabled={prod.stock <= 0}
                        className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-transform duration-100 ${
                          prod.stock <= 0
                            ? 'bg-neutral-100 text-neutral-400'
                            : 'neumorphic-elevated bg-[#fff1f1] text-primary hover:scale-105 active:scale-95'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shopping Cart Sidebar */}
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[32px] p-6 flex flex-col border-4 border-[#fff1f1]">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#241b1b]">
                      Keranjang Belanja
                    </h4>
                    <span className="material-symbols-outlined text-primary text-xl">shopping_cart</span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#877575] font-medium border border-dashed border-[#d8c4c4]/40 rounded-2xl mb-4 bg-white/20">
                      <span className="material-symbols-outlined text-3xl opacity-45 mb-2 block">
                        shopping_cart_clone
                      </span>
                      Keranjang belanja Anda kosong.
                    </div>
                  ) : (
                    <div className="space-y-4 mb-5 max-h-[300px] overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="neumorphic-inset-red-faked bg-white p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-[inset_1px_1.5px_4px_#D1B8B8]"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-neutral-800 truncate mb-0.5">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-primary font-bold">
                              Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrinks-0">
                            <button
                              onClick={() => handleUpdateCartQty(item.id, -1)}
                              className="w-7 h-7 neumorphic-elevated bg-[#fff1f1] rounded-lg flex items-center justify-center text-primary hover:scale-[1.03] transition-transform cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">remove</span>
                            </button>
                            <span className="font-extrabold text-xs w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQty(item.id, 1)}
                              className="w-7 h-7 neumorphic-elevated bg-[#fff1f1] rounded-lg flex items-center justify-center text-primary hover:scale-[1.03] transition-transform cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">add</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-red-600 hover:scale-110 active:scale-95 transition-transform ml-2 shrink-0 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#d8c4c4]/30 mb-5">
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-[#554545] font-semibold">Total Belanja</span>
                      <span className="text-base font-extrabold text-[#9c4242]">
                        Rp {new Intl.NumberFormat('id-ID').format(cartTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutPreCheck}
                    disabled={cart.length === 0}
                    className="w-full text-xs font-extrabold text-white bg-primary hover:bg-[#a31d22] disabled:bg-neutral-100 disabled:text-neutral-400 py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-xs">shopping_bag</span>
                    <span>Pesan Sekarang</span>
                  </button>
                </section>
              </div>
            </div>
          </main>
        ) : isTrackingActive ? (
          /* Active Tracking Pengiriman View (Shopee Style) */
          <main className="p-4 md:p-8 flex-grow pb-24 bg-[#fcfafa]">
            {/* Top Navigation */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => setIsTrackingActive(false)}
                  className="text-primary text-xs font-extrabold hover:underline flex items-center mb-2 cursor-pointer bg-transparent border-none p-0"
                >
                  <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                  Kembali ke Dashboard
                </button>
                <h2 className="text-xl md:text-2xl font-bold text-neutral-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
                  Pelacakan Pengiriman (Kopdes Express)
                </h2>
              </div>
              
              {/* Shopping Quick Link */}
              <button
                onClick={() => {
                  setIsTrackingActive(false);
                  setIsShopActive(true);
                }}
                className="text-xs font-bold text-primary bg-[#fff1f1] hover:bg-primary hover:text-white transition-all px-4 py-2.5 rounded-xl border border-primary/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                Belanja Kebutuhan Lain
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: List of orders */}
              <div className="lg:col-span-4 space-y-4">
                <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[24px] p-5 flex flex-col">
                  <h3 className="font-extrabold text-xs text-[#241b1b] uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Daftar Pesanan Belanja</span>
                    <span className="text-[10px] bg-red-100 text-primary font-extrabold px-2.5 py-0.5 rounded-full">
                      {orders.filter(o => o.memberId === currentUser.id).length} Paket
                    </span>
                  </h3>

                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {orders.filter(o => o.memberId === currentUser.id).length === 0 ? (
                      <div className="text-center py-12 text-neutral-500 text-xs font-bold">
                        Belum ada riwayat pesanan belanja. Silakan belanja di Koperasi Shop terlebih dahulu!
                      </div>
                    ) : (
                      orders
                        .filter(o => o.memberId === currentUser.id)
                        .map((order) => {
                          const isActive = selectedOrderId === order.id;
                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedOrderId(order.id)}
                              className={`p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                                isActive
                                  ? 'bg-[#fff] border-primary shadow-md scale-[1.01]'
                                  : 'bg-[#fffcfc] border-neutral-100 hover:border-neutral-300'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-mono text-[#877575] font-extrabold">
                                  {order.id.startsWith('ord-') ? 'INV-' + order.id.slice(4, 11).toUpperCase() : order.id}
                                </span>
                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                  order.status === 'Tiba di Tujuan'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : order.status === 'Dikirim'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              
                              <p className="font-extrabold text-xs text-neutral-800 truncate mb-1">
                                {order.items.map((it: any) => `${it.name} (${it.quantity}x)`).join(', ')}
                              </p>

                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#d8c4c4]/10 text-[10px] text-neutral-500">
                                <span className="font-semibold">{order.date}</span>
                                <span className="font-extrabold text-primary">
                                  Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Authentic Shopee-style Order Details & Tracking Timeline */}
              <div className="lg:col-span-8">
                {(() => {
                  const currentOrder = orders.find(o => o.id === selectedOrderId) || orders.filter(o => o.memberId === currentUser.id)[0];
                  
                  if (!currentOrder) {
                    return (
                      <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[24px] p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <span className="material-symbols-outlined text-[#877575] text-5xl mb-3">shopping_cart</span>
                        <h4 className="font-bold text-sm text-[#241b1b]">Tidak Ada Pesanan Terpilih</h4>
                        <p className="text-xs text-[#877575] mt-1 max-w-md">
                          Silakan lakukan pembelian di Koperasi Shop terlebih dahulu agar dapat melihat dan memantau status pengiriman barang secara langsung.
                        </p>
                      </section>
                    );
                  }

                  // Elegant GPS Synchronization simulation (pure sync/refresh check)
                  const handleGpsSync = () => {
                    if (isSyncingGps) return;
                    setIsSyncingGps(true);
                    setSyncGpsText("Menghubungkan satelit...");
                    
                    setTimeout(() => {
                      setSyncGpsText("Membaca koordinat kurir...");
                    }, 500);

                    setTimeout(() => {
                      setSyncGpsText("Menyelaraskan rute...");
                    }, 1000);

                    setTimeout(() => {
                      const saved = localStorage.getItem('kopdes_orders');
                      if (saved) {
                        try {
                          setOrders(JSON.parse(saved));
                        } catch (e) {
                          console.error(e);
                        }
                      }
                      setIsSyncingGps(false);
                      alert("Sinkronisasi GPS Berhasil! Data rute kurir Kopdes Express telah diperbarui.");
                    }, 1500);
                  };

                  // Confirm Receipt (Member manual confirmation of delivery)
                  const handleConfirmReceipt = () => {
                    setIsDeliveryConfirmModalOpen(true);
                  };

                  return (
                    <div className="space-y-6">
                      {/* SHOPEE-STYLE HEADER BANNER */}
                      <div className="bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] text-white p-6 rounded-[24px] shadow-md relative overflow-hidden text-left">
                        {/* Background Vector Decoration */}
                        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                          <span className="material-symbols-outlined text-9xl">local_shipping</span>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-orange-100">
                              <span className="bg-white/20 px-2 py-0.5 rounded-md">KOPDES EXPRESS</span>
                              <span>&bull; Layanan Pengiriman Koperasi</span>
                            </div>
                            <h3 className="text-xl font-extrabold mt-1">
                              {currentOrder.status === 'Tiba di Tujuan'
                                ? 'Pesanan Telah Tiba di Tujuan'
                                : currentOrder.status === 'Dikirim'
                                ? 'Paket Sedang Dalam Perjalanan'
                                : 'Pesanan Sedang Dikemas'}
                            </h3>
                            <p className="text-xs text-orange-50/90 mt-1 max-w-lg">
                              {currentOrder.status === 'Tiba di Tujuan'
                                ? 'Pesanan telah diterima oleh Anda. Terima kasih telah berbelanja di Koperasi Desa!'
                                : currentOrder.status === 'Dikirim'
                                ? 'Kurir kami sedang melakukan pengiriman paket langsung ke pintu rumah Anda.'
                                : 'Admin Koperasi sedang menyiapkan & membungkus produk pesanan Anda.'}
                            </p>

                            {/* AUTHENTIC SHOPEE "PESANAN DITERIMA" ACTION BUTTON */}
                            <div className="mt-4">
                              {currentOrder.status === 'Dikirim' ? (
                                <button
                                  onClick={handleConfirmReceipt}
                                  className="bg-white text-[#ee4d2d] hover:bg-orange-50 hover:scale-[1.03] active:scale-[0.97] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer border-none shadow-md"
                                >
                                  <span className="material-symbols-outlined text-sm">verified</span>
                                  <span>Konfirmasi Pesanan Diterima</span>
                                </button>
                              ) : currentOrder.status === 'Diproses' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <button
                                    disabled
                                    className="bg-white/20 text-orange-200 cursor-not-allowed font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 border border-white/10"
                                    title="Tombol aktif setelah pesanan dikirim oleh Admin"
                                  >
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    <span>Konfirmasi Pesanan Diterima</span>
                                  </button>
                                  <p className="text-[10px] text-orange-100 font-semibold italic">
                                    *Tombol aktif jika Admin telah menyerahkan paket ke kurir.
                                  </p>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/30">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  <span>Pesanan Selesai Diterima</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* No. Resi Copy Section */}
                          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-xs w-full sm:w-auto shrink-0">
                            <p className="text-orange-100 font-bold text-[10px] uppercase tracking-wider">No. Resi Pengiriman</p>
                            <div className="flex items-center justify-between sm:justify-start gap-3 mt-1">
                              <span className="font-mono font-extrabold text-sm tracking-wider">{currentOrder.awb}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(currentOrder.awb);
                                  setCopiedAwb(currentOrder.awb);
                                  setTimeout(() => setCopiedAwb(null), 2000);
                                }}
                                className="bg-white text-[#ee4d2d] hover:bg-orange-50 hover:scale-105 active:scale-95 px-2 py-1 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border-none"
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {copiedAwb === currentOrder.awb ? 'done' : 'content_copy'}
                                </span>
                                <span>{copiedAwb === currentOrder.awb ? 'Tersalin' : 'Salin'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SHOPEE-STYLE COURIER & RECIPIENT INFORMATION GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Courier Info */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs text-left flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-50 text-[#ee4d2d] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-lg">motorcycle</span>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-extrabold text-[#877575] uppercase tracking-wider">Informasi Pengirim</h4>
                            <p className="font-extrabold text-xs text-neutral-800 mt-1">
                              {currentOrder.courier}
                            </p>
                            <p className="text-[10px] text-[#877575] mt-0.5">
                              Mitra Kurir Resmi Koperasi Desa Sukamakmur
                            </p>
                          </div>
                        </div>

                        {/* Recipient Address */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs text-left flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-50 text-[#ee4d2d] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[10px] font-extrabold text-[#877575] uppercase tracking-wider">Alamat Pengiriman</h4>
                            <p className="font-extrabold text-xs text-neutral-800 mt-1 truncate">
                              {currentUser.name} <span className="text-neutral-400 font-medium">| {(currentUser as any).phone || "0812-4455-8899"}</span>
                            </p>
                            <p className="text-[10px] text-[#554545] mt-0.5 leading-relaxed truncate">
                              {(currentUser as any).address || "RT 04 / RW 02, Desa Sukamakmur, Jawa Barat"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* SHOPEE-STYLE PROGRESS LINE (Stepper) & INTERACTIVE MAP ACTION */}
                      <div className="bg-white p-6 rounded-[24px] border border-neutral-100 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100">
                          <div>
                            <h4 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider text-left">
                              Riwayat Perjalanan Paket
                            </h4>
                            <p className="text-[10px] text-[#877575] mt-0.5 text-left">
                              Informasi update real-time logistik desa
                            </p>
                          </div>

                          {/* Beautiful Interactive GPS Simulator Button */}
                          <div className="shrink-0 self-stretch sm:self-auto">
                            {isSyncingGps ? (
                              <div className="px-4 py-2 bg-neutral-100 text-[#ee4d2d] text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-neutral-200">
                                <svg className="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="animate-pulse">{syncGpsText}</span>
                              </div>
                            ) : (
                              <button
                                onClick={handleGpsSync}
                                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] hover:scale-[1.02] active:scale-[0.98] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer border-none"
                              >
                                <span className="material-symbols-outlined text-xs animate-pulse">gps_fixed</span>
                                <span>Sinkronisasi GPS Kurir</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* AUTHENTIC SHOPEE VERTICAL TIMELINE LOGS */}
                        <div className="relative border-l-2 border-neutral-100 ml-4 pl-6 space-y-6 text-left">
                          {currentOrder.history.map((hist: any, index: number) => {
                            const isCurrent = index === 0;
                            return (
                              <div key={index} className="relative">
                                {/* Dot node exactly centered on the line */}
                                <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                                  isCurrent
                                    ? (hist.status === 'Tiba di Tujuan' ? 'bg-emerald-500' : 'bg-[#ee4d2d]')
                                    : 'bg-neutral-300'
                                }`}>
                                  {isCurrent && (
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping" />
                                  )}
                                </span>
                                
                                <div className={`${isCurrent ? 'bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100' : ''}`}>
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                                    <span className={`text-xs font-extrabold uppercase tracking-wide ${
                                      isCurrent
                                        ? (hist.status === 'Tiba di Tujuan' ? 'text-emerald-600' : 'text-[#ee4d2d]')
                                        : 'text-neutral-500'
                                    }`}>
                                      {hist.status}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-semibold font-mono">{hist.date}</span>
                                  </div>
                                  <p className={`text-xs font-medium leading-relaxed ${
                                    isCurrent ? 'text-neutral-800' : 'text-neutral-500'
                                  }`}>
                                    {hist.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* SHOPEE-STYLE RINCIAN PESANAN (Itemized Receipt) */}
                      <div className="bg-white p-6 rounded-[24px] border border-neutral-100 shadow-xs space-y-4 text-left">
                        <div className="flex items-center gap-1.5 pb-3 border-b border-neutral-100">
                          <span className="material-symbols-outlined text-lg text-primary">receipt</span>
                          <h4 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                            Rincian Pembayaran Belanja
                          </h4>
                        </div>

                        {/* List of Products */}
                        <div className="space-y-3">
                          {currentOrder.items.map((it: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <div>
                                <span className="text-neutral-800 font-extrabold">{it.name}</span>
                                <span className="text-[#877575] font-bold ml-1.5">x{it.quantity}</span>
                              </div>
                              <span className="font-bold text-neutral-800">
                                Rp {new Intl.NumberFormat('id-ID').format(it.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Invoice Fee Calculation Details */}
                        <div className="pt-3 border-t border-dashed border-neutral-200 space-y-2 text-xs">
                          <div className="flex justify-between text-[#877575] font-semibold">
                            <span>Subtotal untuk Produk</span>
                            <span>Rp {new Intl.NumberFormat('id-ID').format(currentOrder.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-[#877575] font-semibold">
                            <span>Biaya Pengiriman</span>
                            <span className="text-emerald-600 font-extrabold">Gratis Ongkir</span>
                          </div>
                          <div className="flex justify-between text-[#877575] font-semibold">
                            <span>Metode Pembayaran</span>
                            <span className="font-extrabold text-neutral-700">Autodebet Saldo Simpanan</span>
                          </div>

                          <div className="pt-3 border-t border-neutral-200 flex justify-between items-center text-xs font-extrabold">
                            <span className="text-neutral-800">Total Pembayaran</span>
                            <span className="text-[#ee4d2d] text-base">
                              Rp {new Intl.NumberFormat('id-ID').format(currentOrder.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </main>
        ) : (
          /* Active Angsuran & Tagihan View */
          <main className="p-8 flex-grow">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setIsAngsuranActive(false)}
                  className="text-primary text-xs font-bold hover:underline flex items-center mb-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                  Kembali ke Dashboard
                </button>
                <h2 className="text-xl md:text-2xl font-bold text-neutral-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
                  Layanan Angsuran & Tagihan Bulanan (Autodebet)
                </h2>
                <p className="text-xs md:text-sm text-[#554545] mt-1">
                  Kelola pelunasan cicilan pinjaman Anda secara otomatis memotong saldo simpanan secara mandiri.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAngsuranActive(false);
                    setIsShopActive(false);
                  }}
                  className="neumorphic-elevated-red font-bold rounded-xl flex items-center px-4 py-2.5 text-xs text-[#877575] hover:text-primary transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined mr-1.5 text-xs">dashboard</span>
                  Dashboard
                </button>
                <button
                  onClick={() => onSwitchView('loan-calculator')}
                  className="neumorphic-elevated-red font-bold rounded-xl flex items-center px-4 py-2.5 text-xs text-primary hover:bg-[#fff1f1]/40 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined mr-1.5 text-xs">add_box</span>
                  Ajukan Pinjaman Baru
                </button>
              </div>
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-16">
              {/* Left column - Status & Action */}
              <div className="lg:col-span-4 space-y-6">
                {/* Loan Overview Panel */}
                <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[32px] p-6 space-y-5">
                  <h3 className="font-bold text-sm text-[#241b1b] uppercase tracking-wider">
                    Informasi Pinjaman Serta Angsuran
                  </h3>

                  {activePersonalLoan && activePersonalLoan.status === 'approved' ? (
                    <div className="space-y-4">
                      <div className="neumorphic-inset-red p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-[#877575] font-semibold">Tujuan Pinjaman</span>
                          <span className="text-xs font-bold text-primary">{activePersonalLoan.purpose}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-[#877575] font-semibold">Besar Pinjaman</span>
                          <span className="text-xs font-bold font-sans">Rp {new Intl.NumberFormat('id-ID').format(activePersonalLoan.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-[#877575] font-semibold">Tenor Asli</span>
                          <span className="text-xs font-bold">{activePersonalLoan.tenor} Bulan</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-[#877575] font-semibold">Suku Bunga</span>
                          <span className="text-xs font-bold text-amber-700">{interestRate}% Flat / bln</span>
                        </div>
                      </div>

                      {/* Progress circle / stat bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#554545]">Progres Pelunasan</span>
                          <span>{progressPercent}% ({safePaidMonths}/{actualTenor} Bulan)</span>
                        </div>
                        <div className="w-full h-4 neumorphic-inset-red rounded-full overflow-hidden p-0.5 bg-neutral-200/50">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-yellow-600 rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center text-xs text-[#877575] font-semibold">
                        <span>Total Terbayar: {progressPercent}%</span>
                        <span>Sisa Tenor: {actualTenor - safePaidMonths} Bulan</span>
                      </div>
                    </div>
                  ) : activePersonalLoan && activePersonalLoan.status === 'pending' ? (
                    <div className="space-y-4">
                      {/* For simulation capability, let's treat it as approved since we can let Budi test paying tagihan! */}
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-2 text-xs text-orange-850">
                        <p className="font-bold flex items-center gap-1 text-orange-800 mb-1">
                          <span className="material-symbols-outlined text-xs">info</span> 
                          Simulasi Angsuran Aktif
                        </p>
                        <p className="leading-relaxed">
                          Status pengajuan awal Anda adalah <strong>PENDING</strong>, namun kami mengaktifkan modul Pembayaran Angsuran di bawah ini agar Anda tetap bisa melakukan simulasi Autodebet dan melihat History tagihan.
                        </p>
                      </div>

                      <div className="neumorphic-inset-red p-4 rounded-2xl space-y-3 bg-[#fdfdfd]">
                        <div className="flex justify-between">
                          <span className="text-xs text-[#877575] font-semibold">Jenis Pinjaman Sim</span>
                          <span className="text-xs font-bold text-primary">{activePersonalLoan.purpose}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-[#877575] font-semibold">Besar Pinjaman</span>
                          <span className="text-xs font-bold">Rp {new Intl.NumberFormat('id-ID').format(activePersonalLoan.amount || 10000000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-[#877575] font-semibold">Tenor Pembiayaan</span>
                          <span className="text-xs font-bold">{activePersonalLoan.tenor || 12} Bulan</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="neumorphic-inset-red p-5 rounded-2xl text-center space-y-3">
                      <span className="material-symbols-outlined text-neutral-400 text-3xl">monetization_on</span>
                      <p className="text-xs font-bold text-[#877575]">
                        Tidak Ada Pinjaman Aktif
                      </p>
                      <button
                        onClick={() => onSwitchView('loan-calculator')}
                        className="w-full text-xs font-bold text-white bg-primary py-2 px-4 rounded-xl hover:bg-[#a31d22] transition-colors cursor-pointer"
                      >
                        Ajukan Pinjaman Sekarang
                      </button>
                    </div>
                  )}
                </section>

                {/* Bill Card / Tagihan Aktif */}
                {activePersonalLoan && (
                  <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[32px] p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-[#241b1b] uppercase tracking-wider">
                        Tagihan Berjalan
                      </h3>
                      {safePaidMonths < actualTenor ? (
                        <span className="text-[10px] bg-red-100 text-primary px-2.5 py-1 rounded-full font-bold uppercase animate-pulse">
                          Menunggu Pembayaran
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-[#0f5132] px-2.5 py-1 rounded-full font-bold uppercase">
                          Lunas
                        </span>
                      )}
                    </div>

                    {safePaidMonths < actualTenor ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-[#801317] text-white space-y-3 shadow-md">
                          <div>
                            <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                              Angsuran Bulan Ke-{safePaidMonths + 1}
                            </p>
                            <p className="text-xl font-black mt-1">
                              Rp {new Intl.NumberFormat('id-ID').format(activePersonalLoan.monthlyInstallment || Math.round(activePersonalLoan.amount / actualTenor + activePersonalLoan.amount * interestMultiplier))}
                            </p>
                          </div>
                          
                          <div className="pt-2 border-t border-white/20 flex justify-between items-center text-xs text-white/90 font-semibold">
                            <span>Jatuh Tempo:</span>
                            <span>25 tiap bulan</span>
                          </div>
                        </div>

                        <div className="text-xs text-[#554545] bg-[#fffcfc] p-3 rounded-xl border border-dashed border-[#d8c4c4]">
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-sm shrink-0">info</span>
                            <p className="leading-relaxed">
                              Pembayaran ini akan langsung memotong **Saldo Simpanan Sukarela** Anda sejumlah **Rp {new Intl.NumberFormat('id-ID').format(activePersonalLoan.monthlyInstallment || Math.round(activePersonalLoan.amount / actualTenor + activePersonalLoan.amount * interestMultiplier))}**. Pastikan saldo mencukupi.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsInstallmentConfirmModalOpen(true);
                          }}
                          className="w-full text-xs font-bold text-white bg-primary hover:bg-[#a31d22] py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">payments</span>
                          <span>Bayar Angsuran Sekarang</span>
                        </button>
                      </div>
                    ) : (
                      <div className="neumorphic-inset-red p-5 rounded-2xl text-center space-y-2">
                        <span className="material-symbols-outlined text-emerald-600 text-3xl">task_alt</span>
                        <p className="text-xs font-bold text-neutral-800">Pinjaman Lunas Sepenuhnya!</p>
                        <p className="text-[10px] text-[#877575]">
                          Seluruh kewajiban pembayaran pinjaman Anda telah dituntaskan. Terima kasih atas kerja sama dan kedisiplinan Anda.
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Right column - Bill History & Receipts */}
              <div className="lg:col-span-8 flex flex-col">
                <section className="neumorphic-elevated-red bg-[#fff8f8] rounded-[32px] p-6 flex-grow flex flex-col space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#d8c4c4]/20">
                    <div>
                      <h3 className="font-bold text-sm text-[#241b1b] uppercase tracking-wider">
                        Rincian Tagihan & Pembayaran
                      </h3>
                      <p className="text-xs text-[#877575] mt-0.5">
                        Kelola jadwal jatuh tempo dan lihat seluruh riwayat kuitansi resmi Anda.
                      </p>
                    </div>
                    {activePersonalLoan && (
                      <span className="text-xs font-bold text-green-700 bg-emerald-50 px-3 py-1 rounded-full">
                        {safePaidMonths} Lunas / {actualTenor - safePaidMonths} Sisa
                      </span>
                    )}
                  </div>

                  {/* Tab bar */}
                  {activePersonalLoan && (
                    <div className="flex gap-2 bg-[#fbebeb]/30 p-1.5 rounded-2xl border border-[#f5dede]">
                      <button
                        type="button"
                        onClick={() => setAngsuranTab('schedule')}
                        className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                          angsuranTab === 'schedule'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-[#877575] hover:text-primary bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Jadwal & Jatuh Tempo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAngsuranTab('history')}
                        className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                          angsuranTab === 'history'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-[#877575] hover:text-primary bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                        <span>Riwayat Kuitansi ({safePaidMonths})</span>
                      </button>
                    </div>
                  )}

                  {activePersonalLoan ? (
                    angsuranTab === 'schedule' ? (
                      /* TAB 1: SCHEDULE & DUE DATES */
                      <div className="flex-grow overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-[#d8c4c4]/30 text-xs text-[#877575] font-bold uppercase">
                              <th className="py-3 px-4">Tagihan Bulanan</th>
                              <th className="py-3 px-4">Tanggal Jatuh Tempo</th>
                              <th className="py-3 px-4 text-right">Jumlah Tagihan</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-center">Aksi / Informasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d8c4c4]/20 text-xs text-neutral-800">
                            {Array.from({ length: actualTenor }).map((_, index) => {
                              const monthIdx = index + 1;
                              const isPaid = monthIdx <= safePaidMonths;
                              const instAmount = activePersonalLoan.monthlyInstallment || Math.round(activePersonalLoan.amount / actualTenor + activePersonalLoan.amount * interestMultiplier);
                              
                              const dueInfo = getDueDateForMonth(activePersonalLoan.date, monthIdx);
                              
                              return (
                                <tr
                                  key={monthIdx}
                                  className={`hover:bg-neutral-50/50 transition-colors ${
                                    !isPaid && monthIdx === safePaidMonths + 1 ? 'bg-red-50/20 font-medium' : ''
                                  }`}
                                >
                                  <td className="py-3.5 px-4">
                                    <span className="font-bold text-neutral-800">Bulan ke-{monthIdx}</span>
                                    <span className="block text-[10px] text-[#877575]">Tagihan Autodebet</span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-neutral-800">{dueInfo.dateStr}</span>
                                      {!isPaid && (
                                        <span
                                          className={`text-[10px] font-bold ${
                                            dueInfo.status === 'TERLAMBAT'
                                              ? 'text-red-600'
                                              : dueInfo.status === 'JATUH_TEMPO_HARI_INI'
                                              ? 'text-amber-600 font-extrabold animate-pulse'
                                              : 'text-neutral-500'
                                          }`}
                                        >
                                          {dueInfo.daysDiffText}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-extrabold text-neutral-900 font-sans">
                                    Rp {new Intl.NumberFormat('id-ID').format(instAmount)}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    {isPaid ? (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                                        <span className="material-symbols-outlined text-[10px]">done</span>
                                        LUNAS
                                      </span>
                                    ) : dueInfo.status === 'TERLAMBAT' ? (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-100/60 px-2.5 py-0.5 rounded-full animate-pulse">
                                        <span className="material-symbols-outlined text-[10px]">warning</span>
                                        TERLAMBAT
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-full">
                                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                                        BELUM BAYAR
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    {isPaid ? (
                                      <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-0.5">
                                        <span className="material-symbols-outlined text-xs">verified</span>
                                        Sudah Lunas
                                      </span>
                                    ) : monthIdx === safePaidMonths + 1 ? (
                                      <button
                                        type="button"
                                        onClick={() => setIsInstallmentConfirmModalOpen(true)}
                                        className="px-3 py-1.5 bg-primary hover:bg-[#a31d22] text-white font-extrabold text-[10px] rounded-xl transition-colors cursor-pointer shadow-sm border-none"
                                      >
                                        Bayar Sekarang
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-[#877575] font-medium flex items-center justify-center gap-0.5">
                                        <span className="material-symbols-outlined text-xs">lock</span>
                                        Menunggu antrean
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* TAB 2: COMPLETED PAYMENT RECEIPTS */
                      safePaidMonths > 0 ? (
                        <div className="flex-grow overflow-x-auto">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="border-b border-[#d8c4c4]/30 text-xs text-[#877575] font-bold uppercase">
                                <th className="py-3 px-4">Deskripsi Tagihan</th>
                                <th className="py-3 px-4 text-right">Nominal</th>
                                <th className="py-3 px-4">Tanggal Pembayaran</th>
                                <th className="py-3 px-4">Metode Bayar</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#d8c4c4]/20 text-xs text-neutral-800">
                              {Array.from({ length: safePaidMonths }).map((_, index) => {
                                const monthIdx = index + 1;
                                
                                // Generate mock dates for history row nicely
                                const dateObj = new Date();
                                dateObj.setMonth(dateObj.getMonth() - (safePaidMonths - monthIdx));
                                dateObj.setDate(25);
                                
                                const formattedDate = dateObj.toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                });
                                
                                const refCode = `REC-ANS-${actualTenor}${monthIdx}-${Date.now().toString().slice(-4)}`;
                                const instAmount = activePersonalLoan.monthlyInstallment || Math.round(activePersonalLoan.amount / actualTenor + activePersonalLoan.amount * interestMultiplier);

                                return (
                                  <tr key={monthIdx} className="hover:bg-neutral-50/50 transition-colors">
                                    <td className="py-3.5 px-4">
                                      <p className="font-bold text-neutral-800">Angsuran Bulan ke-{monthIdx}</p>
                                      <span className="text-[10px] text-[#877575] font-mono">{refCode}</span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-bold text-neutral-900 font-sans">
                                      Rp {new Intl.NumberFormat('id-ID').format(instAmount)}
                                    </td>
                                    <td className="py-3.5 px-4 text-[#554545] font-semibold">
                                      {formattedDate}
                                    </td>
                                    <td className="py-3.5 px-4 text-[#665555] font-medium">
                                      Debet Otomatis
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                                        <span className="material-symbols-outlined text-[10px]">done</span>
                                        LUNAS
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDownloadingInvoiceId(`rec-${monthIdx}`);
                                          setTimeout(() => {
                                            setDownloadingInvoiceId(null);
                                            alert(`=== KUITANSI RESMI ANGSURAN ===\nKoperasi Unit Desa Merah Putih\n=================================\n\nNo Kuitansi: ${refCode}\nAnggota: ${currentUser.name}\nTagihan: Angsuran Bulan ke-${monthIdx} dari ${actualTenor}\nNominal: Rp ${new Intl.NumberFormat('id-ID').format(instAmount)}\nTanggal Bayar: ${formattedDate}\nMetode: Autodebet Saldo Simpanan (Sukses)\n\nKuitansi ini sah dan diterbitkan secara elektronik oleh sistem Koperasi Desa Merah Putih.`);
                                          }, 800);
                                        }}
                                        className="text-[11px] font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer bg-transparent border-none"
                                        disabled={downloadingInvoiceId !== null}
                                      >
                                        <span className="material-symbols-outlined text-xs">
                                          {downloadingInvoiceId === `rec-${monthIdx}` ? 'hourglass_bottom' : 'download'}
                                        </span>
                                        <span>{downloadingInvoiceId === `rec-${monthIdx}` ? 'Proses...' : 'Kuitansi'}</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 space-y-2">
                          <span className="material-symbols-outlined text-[#877575] text-4xl">receipt</span>
                          <p className="text-sm font-bold text-[#554545]">Belum Ada Riwayat Pembayaran</p>
                          <p className="text-xs text-[#877575] max-w-sm">
                            Catatan pencatatan pembayaran cicilan Anda akan ditampilkan secara transparan di tabel ini setelah Anda pertama kali menyetorkan angsuran.
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 space-y-2">
                      <span className="material-symbols-outlined text-[#877575] text-4xl">payments</span>
                      <p className="text-sm font-bold text-[#554545]">Tidak Ada Pinjaman Aktif</p>
                      <p className="text-xs text-[#877575] max-w-sm">
                        Anda tidak memiliki pinjaman aktif saat ini. Seluruh jadwal tagihan dan riwayat akan tampil setelah pengajuan pinjaman disetujui.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#fff8f8] shadow-[0_-6px_12px_#D1B8B8] flex justify-around items-center py-2.5 z-40">
        <button
          onClick={() => {
            setIsShopActive(false);
            setIsAngsuranActive(false);
            setIsTrackingActive(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-xs ${
            (!isShopActive && !isAngsuranActive && !isTrackingActive) ? 'text-primary font-bold' : 'text-[#877575]'
          }`}
        >
          <span className="material-symbols-outlined text-base">dashboard</span>
          <span className="text-[9px]">Home</span>
        </button>

        <button
          onClick={() => {
            setIsShopActive(true);
            setIsAngsuranActive(false);
            setIsTrackingActive(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-xs ${
            (isShopActive && !isAngsuranActive && !isTrackingActive) ? 'text-primary font-bold' : 'text-[#877575]'
          }`}
        >
          <span className="material-symbols-outlined text-base">shopping_bag</span>
          <span className="text-[9px]">Belanja</span>
        </button>

        <button
          onClick={() => {
            setIsShopActive(false);
            setIsAngsuranActive(false);
            setIsTrackingActive(true);
          }}
          className={`flex flex-col items-center gap-0.5 text-xs ${
            isTrackingActive ? 'text-primary font-bold' : 'text-[#877575]'
          }`}
        >
          <span className="material-symbols-outlined text-base">local_shipping</span>
          <span className="text-[9px]">Lacak</span>
        </button>

        <button
          onClick={() => {
            setIsShopActive(false);
            setIsAngsuranActive(true);
            setIsTrackingActive(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-xs ${
            isAngsuranActive ? 'text-primary font-bold' : 'text-[#877575]'
          }`}
        >
          <span className="material-symbols-outlined text-base">receipt_long</span>
          <span className="text-[9px]">Angsuran</span>
        </button>

        <div className="pb-4">
          <button
            onClick={() => onSwitchView('loan-calculator')}
            className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-red-600/30"
          >
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
        </div>

        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-0.5 text-xs text-[#877575]"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span className="text-[9px]">Keluar</span>
        </button>
      </nav>

      {/* MODAL: TOP UP DIALOG */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fff8f8] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#d8c4c4]/30">
              <h3 className="text-sm font-extrabold uppercase tracking-widest">Setor Simpanan Sukarela</h3>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="material-symbols-outlined text-neutral-500 hover:text-black cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#877575]">Nominal Deposit (Rp)</label>
                <div className="neumorphic-inset-red rounded-xl p-1.5 flex items-center h-12">
                  <span className="material-symbols-outlined ml-2 text-neutral-400">payments</span>
                  <input
                    type="number"
                    required
                    min="50000"
                    placeholder="Contoh: 1000000"
                    className="w-full bg-transparent border-none outline-none ring-0 focus:ring-0 py-2 px-3 text-sm font-bold"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 block px-1 mt-1">
                  *Dana akan langsung didepositokan ke Saldo Simpanan Anda.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[500000, 1000000, 2500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopUpAmount(val)}
                    className="bg-white hover:bg-neutral-50 py-2.5 rounded-xl text-xs font-bold shadow-[2px_2px_4px_#D1B8B8] hover:scale-102 transition-all cursor-pointer border border-[#d8c4c4]/10"
                  >
                    Rp {(val / 1000000).toFixed(1)}M
                  </button>
                ))}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-extrabold text-xs hover:bg-[#a31d22] transition-colors cursor-pointer"
                >
                  Proses Setoran
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: ALL TRANSACTIONS DIALOG */}
      {isAllTransactionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fff8f8] rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#d8c4c4]/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">history</span>
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#241b1b]">
                  Riwayat Lengkap Transaksi
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAllTransactionsModalOpen(false);
                  setModalSearchQuery('');
                  setModalTxTypeFilter('all');
                }}
                className="material-symbols-outlined text-neutral-500 hover:text-black cursor-pointer bg-transparent border-none p-1"
                title="Tutup"
              >
                close
              </button>
            </div>

            {/* Filters and Search Bar inside modal */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {/* Search */}
              <div className="flex-1 neumorphic-inset-red px-3 py-2 rounded-xl flex items-center gap-2 bg-white/50">
                <span className="material-symbols-outlined text-[#877575] text-sm">search</span>
                <input
                  type="text"
                  placeholder="Cari deskripsi transaksi..."
                  className="bg-transparent border-none outline-none focus:ring-0 text-xs w-full py-1"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                />
              </div>

              {/* Type Category Tab switches */}
              <div className="flex p-0.5 bg-white/40 rounded-xl shadow-[inset_1px_1px_4px_#D1B8B8] max-w-fit gap-0.5 border border-[#d8c4c4]/20 self-start sm:self-auto">
                {(['all', 'in', 'out'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setModalTxTypeFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      modalTxTypeFilter === filter
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-[#877575] hover:text-primary font-bold'
                    }`}
                  >
                    {filter === 'all' ? 'Semua' : filter === 'in' ? 'Masuk (+)' : 'Keluar (-)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Transaction List */}
            <div className="flex-grow overflow-y-auto pr-1">
              {transactions.filter((t) => {
                const matchesSearch = t.description.toLowerCase().includes(modalSearchQuery.toLowerCase());
                const matchesType = modalTxTypeFilter === 'all' || t.type === modalTxTypeFilter;
                return matchesSearch && matchesType;
              }).length === 0 ? (
                <div className="text-center py-12 text-xs text-[#877575] font-semibold">
                  Tidak ada transaksi yang cocok dengan pencarian Anda.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#fff8f8] z-10">
                    <tr className="border-b border-[#d8c4c4]">
                      <th className="py-2.5 px-2 text-xs font-semibold text-[#554545]">Deskripsi</th>
                      <th className="py-2.5 px-2 text-xs font-semibold text-[#554545]">Tanggal</th>
                      <th className="py-2.5 px-2 text-xs font-semibold text-[#554545] text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter((t) => {
                        const matchesSearch = t.description.toLowerCase().includes(modalSearchQuery.toLowerCase());
                        const matchesType = modalTxTypeFilter === 'all' || t.type === modalTxTypeFilter;
                        return matchesSearch && matchesType;
                      })
                      .map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-[#d8c4c4]/20 hover:bg-[#fff1f1]/50 transition-colors"
                        >
                          <td className="py-3 px-2 flex items-center gap-3">
                            <div className="w-8 h-8 neumorphic-inset-red rounded-full flex items-center justify-center shrink-0">
                              <span className={`material-symbols-outlined text-sm ${tx.color}`}>
                                {tx.icon === 'add' ? 'add' : tx.icon === 'remove' ? 'remove' : 'payments'}
                              </span>
                            </div>
                            <span className="font-semibold text-xs md:text-sm">{tx.description}</span>
                          </td>
                          <td className="py-3 px-2 text-[#554545] text-xs font-medium">{tx.date}</td>
                          <td className={`py-3 px-2 text-right font-bold text-xs md:text-sm ${tx.type === 'in' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {tx.type === 'in' ? '+' : '-'} Rp{' '}
                            {new Intl.NumberFormat('id-ID').format(tx.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick Metrics Footer inside Modal */}
            <div className="pt-3 border-t border-[#d8c4c4]/30 flex flex-col sm:flex-row justify-between items-center text-xs text-[#554545] gap-2 shrink-0">
              <div className="flex gap-4">
                <span>
                  Total Kas Masuk:{' '}
                  <strong className="text-emerald-700">
                    Rp{' '}
                    {new Intl.NumberFormat('id-ID').format(
                      transactions
                        .filter((tx) => tx.type === 'in' && tx.description.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    )}
                  </strong>
                </span>
                <span>
                  Total Kas Keluar:{' '}
                  <strong className="text-red-700">
                    Rp{' '}
                    {new Intl.NumberFormat('id-ID').format(
                      transactions
                        .filter((tx) => tx.type === 'out' && tx.description.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    )}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAllTransactionsModalOpen(false);
                  setModalSearchQuery('');
                  setModalTxTypeFilter('all');
                }}
                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs shadow-md cursor-pointer hover:bg-[#a31d22]"
              >
                Tutup Jendela
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: CUSTOM PAY_INSTALLMENT CONFIRMATION DIALOG */}
      {isInstallmentConfirmModalOpen && activePersonalLoan && (() => {
        const cost = activePersonalLoan.monthlyInstallment || Math.round(activePersonalLoan.amount / actualTenor + activePersonalLoan.amount * interestMultiplier);
        const hasSufficientBalance = currentUser.balance >= cost;
        const nextMonth = safePaidMonths + 1;

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#fff8f8] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#d8c4c4]/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#241b1b]">Konfirmasi Pembayaran</h3>
                </div>
                <button
                  onClick={() => setIsInstallmentConfirmModalOpen(false)}
                  className="material-symbols-outlined text-neutral-500 hover:text-black cursor-pointer bg-transparent border-none p-1"
                >
                  close
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-2.5">
                  <div className="flex justify-between text-xs text-[#877575] font-semibold">
                    <span>Angsuran Untuk:</span>
                    <span className="font-bold text-[#241b1b]">Bulan Ke-{nextMonth}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#877575] font-semibold">
                    <span>Tujuan Pinjaman:</span>
                    <span className="font-bold text-[#241b1b]">{activePersonalLoan.purpose}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#877575] font-semibold">
                    <span>Tenor Pinjaman:</span>
                    <span className="font-bold text-[#241b1b]">{actualTenor} Bulan</span>
                  </div>
                  <div className="pt-2 border-t border-[#d8c4c4]/30 flex justify-between items-center">
                    <span className="text-xs text-[#877575] font-semibold">Jumlah Tagihan:</span>
                    <span className="text-base font-extrabold text-primary">
                      Rp {new Intl.NumberFormat('id-ID').format(cost)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs px-2">
                  <span className="text-[#877575] font-semibold">Saldo Simpanan Anda:</span>
                  <span className={`font-bold ${hasSufficientBalance ? 'text-emerald-600' : 'text-primary'}`}>
                    Rp {new Intl.NumberFormat('id-ID').format(currentUser.balance)}
                  </span>
                </div>

                {!hasSufficientBalance ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      Saldo Tidak Mencukupi!
                    </p>
                    <p>
                      Maaf, saldo simpanan Sukarela Anda tidak mencukupi untuk melakukan pembayaran angsuran ini. Silakan tambahkan saldo terlebih dahulu.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 leading-relaxed">
                    <p className="font-bold flex items-center gap-1 text-emerald-700 mb-0.5">
                      <span className="material-symbols-outlined text-xs">info</span>
                      Sistem Autodebet
                    </p>
                    Pembayaran ini akan langsung mendebet saldo simpanan Anda secara otomatis dan aman tanpa biaya admin tambahan.
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsInstallmentConfirmModalOpen(false)}
                  className="flex-grow py-3 bg-neutral-100 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                {hasSufficientBalance ? (
                  <button
                    type="button"
                    onClick={() => {
                      const updatedMembers = members.map((m) => {
                        if (m.id === currentUser.id) {
                          const isFullyPaid = nextMonth >= activePersonalLoan.tenor;
                          return {
                            ...m,
                            balance: m.balance - cost,
                            activeLoan: isFullyPaid ? 0 : m.activeLoan
                          };
                        }
                        return m;
                      });
                      
                      const updatedLoans = (loans || []).map((l) =>
                        l.id === activePersonalLoan.id ? { ...l, paidMonths: nextMonth } : l
                      );
                      
                      setPaidMonths(nextMonth);
                      
                      const newTx: Transaction = {
                        id: `tx-ang-${Date.now()}`,
                        description: `Autodebet Angsuran Bulan Ke-${nextMonth} (${activePersonalLoan.purpose})`,
                        date: 'Hari ini',
                        amount: cost,
                        type: 'out',
                        icon: 'account_balance',
                        color: 'text-[#ce2029]',
                      };
                      
                      const newActivity: RecentActivity = {
                        id: `act-${Date.now()}`,
                        type: 'purchase',
                        title: 'Autodebet Angsuran Sukses',
                        description: `${currentUser.name} membayar Angsuran Bulan ke-${nextMonth} sebesar Rp ${new Intl.NumberFormat('id-ID').format(cost)}.`,
                        time: 'Baru saja',
                        color: 'text-[#ce2029]',
                        icon: 'verified_user',
                        timestamp: new Date().toISOString(),
                      };
                      
                      onUpdateDatabase({
                        members: updatedMembers,
                        loans: updatedLoans,
                        transactions: [newTx, ...transactions],
                        activities: [newActivity, ...activities]
                      });

                      setIsInstallmentConfirmModalOpen(false);
                      setModalAlertMessage({
                        title: 'Pembayaran Angsuran Berhasil!',
                        message: `Selamat! Pembayaran Angsuran Bulan ke-${nextMonth} sebesar Rp ${new Intl.NumberFormat('id-ID').format(cost)} berhasil diproses melalui autodebet.`,
                        type: 'success'
                      });
                    }}
                    className="flex-grow py-3 bg-primary text-white rounded-xl font-extrabold text-xs hover:bg-[#a31d22] transition-colors cursor-pointer"
                  >
                    Ya, Konfirmasi Bayar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsInstallmentConfirmModalOpen(false);
                      setIsTopUpModalOpen(true);
                    }}
                    className="flex-grow py-3 bg-amber-600 text-white rounded-xl font-extrabold text-xs hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Setor Simpanan
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* MODAL: EDIT PROFILE / UBAH PROFIL */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fff8f8] rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-[#d8c2c2]/20 pb-4">
              <h3 className="text-lg font-extrabold text-[#241b1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_edit</span>
                Ubah Profil Saya
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
                <div className="w-20 h-20 rounded-full neumorphic-elevated-red overflow-hidden border-4 border-[#fff8f8] relative">
                  <img
                    alt="Pratinjau Avatar"
                    className="w-full h-full object-cover"
                    src={profileAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-primary uppercase bg-[#fff0f0] px-2.5 py-1 rounded-full">
                  Pratinjau Avatar
                </span>
              </div>

              {/* Input Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#877575] ml-1">Nama Lengkap</label>
                <div className="neumorphic-inset-red flex items-center px-4 py-3 rounded-xl bg-[#fffcfc]">
                  <span className="material-symbols-outlined text-neutral-400 mr-2.5 text-lg">badge</span>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Anda"
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-semibold text-[#241b1b]"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
              </div>

              {/* Preset Avatar Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#877575] ml-1">Pilih Preset Avatar</label>
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
                <label className="text-xs font-bold text-[#877575] ml-1">Link Avatar Kustom (URL Gambar)</label>
                <div className="neumorphic-inset-red flex items-center px-4 py-2 rounded-xl bg-[#fffcfc]">
                  <span className="material-symbols-outlined text-neutral-400 mr-2.5 text-lg">link</span>
                  <input
                    type="url"
                    placeholder="https://example.com/foto.jpg"
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs text-[#241b1b]"
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

      {/* MODAL: GENERIC CUSTOM POPUP ALERT/DIOLOG */}
      {modalAlertMessage && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#fff8f8] rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-2xl">
                {modalAlertMessage.type === 'success' ? 'verified' : 'info'}
              </span>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-[#241b1b]">{modalAlertMessage.title}</h3>
              <p className="text-xs text-[#877575] leading-relaxed px-2">
                {modalAlertMessage.message}
              </p>
            </div>

            <button
              onClick={() => setModalAlertMessage(null)}
              className="w-full py-2.5 bg-primary hover:bg-[#a31d22] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              Selesai & Tutup
            </button>
          </motion.div>
        </div>
      )}

      {/* MODAL: SHOPEE-STYLE CHECKOUT CONFIRMATION */}
      {isCheckoutConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 flex flex-col my-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] text-white p-5 text-left relative">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span className="material-symbols-outlined">receipt_long</span>
                Konfirmasi Pesanan Belanja
              </h3>
              <p className="text-[10px] text-orange-100 mt-1 font-medium">
                Periksa kembali detail pesanan Anda sebelum melakukan pembayaran autodebet saldo.
              </p>
            </div>

            <div className="p-6 space-y-5 text-left max-h-[60vh] overflow-y-auto scrollbar-thin">
              {/* Alamat Pengiriman */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-neutral-400 font-extrabold text-[10px] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                  <span>Alamat Pengiriman (Kopdes Express)</span>
                </div>
                <div className="bg-neutral-50/75 rounded-2xl p-3.5 border border-neutral-100 space-y-1">
                  <p className="font-extrabold text-xs text-neutral-800">{currentUser.name}</p>
                  <p className="text-[11px] text-neutral-500 font-semibold">HP: {(currentUser as any).phone || '0812-4455-8899'}</p>
                  <p className="text-[11px] text-neutral-500 leading-relaxed break-words">
                    {(currentUser as any).address || 'RT 04 / RW 02, Desa Sukamakmur, Jawa Barat'}
                  </p>
                </div>
              </div>

              {/* Rincian Item */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-neutral-400 font-extrabold text-[10px] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs text-primary">shopping_basket</span>
                  <span>Produk Yang Dibeli</span>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-neutral-700 bg-neutral-50/40 p-2.5 rounded-xl border border-neutral-100/50">
                      <div className="truncate pr-4">
                        <span className="font-extrabold text-neutral-800">{item.name}</span>
                        <span className="text-primary font-black ml-1.5">x{item.quantity}</span>
                      </div>
                      <span className="font-bold text-neutral-800 shrink-0">
                        Rp {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ekspedisi & Metode Pembayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-50/75 rounded-2xl p-3 border border-neutral-100 space-y-1">
                  <span className="text-[8px] font-extrabold text-neutral-400 uppercase tracking-wider">Metode Kirim</span>
                  <p className="font-extrabold text-[11px] text-neutral-800">Kopdes Express</p>
                  <p className="text-[10px] text-emerald-600 font-extrabold">Gratis Ongkir Desa</p>
                </div>
                <div className="bg-neutral-50/75 rounded-2xl p-3 border border-neutral-100 space-y-1">
                  <span className="text-[8px] font-extrabold text-neutral-400 uppercase tracking-wider">Metode Bayar</span>
                  <p className="font-extrabold text-[11px] text-neutral-800">Autodebet Simpanan</p>
                  <p className="text-[10px] text-neutral-500 font-semibold">Sisa: Rp {new Intl.NumberFormat('id-ID').format(currentUser.balance - cartTotal)}</p>
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="border-t border-dashed border-neutral-200 pt-4 space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal untuk Produk</span>
                  <span className="font-semibold text-neutral-800">Rp {new Intl.NumberFormat('id-ID').format(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal Pengiriman</span>
                  <span className="font-extrabold text-emerald-600">Rp 0 (Gratis)</span>
                </div>
                <div className="flex justify-between text-sm font-black text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total Pembayaran</span>
                  <span className="text-[#ee4d2d]">Rp {new Intl.NumberFormat('id-ID').format(cartTotal)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 bg-neutral-50 border-t border-neutral-100 flex gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutConfirmModalOpen(false)}
                className="flex-1 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-2xl font-extrabold text-xs transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={executeCheckout}
                className="flex-1 py-3 bg-[#ee4d2d] hover:bg-[#d83f20] text-white rounded-2xl font-extrabold text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">payments</span>
                <span>Buat Pesanan & Bayar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: SHOPEE-STYLE DELIVERY CONFIRMATION (PESANAN DITERIMA) */}
      {isDeliveryConfirmModalOpen && (() => {
        const currentOrderToConfirm = orders.find(o => o.id === selectedOrderId) || orders.filter(o => o.memberId === currentUser.id)[0];
        if (!currentOrderToConfirm) return null;

        const handleConfirmReceiptFinal = () => {
          setIsDeliveryConfirmModalOpen(false);

          const timeStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + " " + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          const logDescription = `[Selesai] Paket telah diterima dengan baik oleh anggota (${currentUser.name}) dan pesanan dinyatakan selesai.`;
          
          const updated = orders.map(o => {
            if (o.id === currentOrderToConfirm.id) {
              const newHistory = [
                { status: 'Tiba di Tujuan', date: timeStr, description: logDescription },
                ...o.history
              ];
              return {
                ...o,
                status: 'Tiba di Tujuan',
                history: newHistory
              };
            }
            return o;
          });

          setOrders(updated);
          localStorage.setItem('kopdes_orders', JSON.stringify(updated));

          setModalAlertMessage({
            title: 'Pesanan Selesai!',
            message: 'Terima kasih banyak atas konfirmasi Anda! Semoga produk sembako Koperasi Desa selalu mendatangkan manfaat.',
            type: 'success'
          });
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[28px] max-w-sm w-full overflow-hidden shadow-2xl border border-neutral-100 text-center flex flex-col"
            >
              <div className="p-6 space-y-4">
                {/* Visual Icon */}
                <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-orange-50 text-[#ee4d2d] animate-bounce">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-[#241b1b]">Konfirmasi Pesanan Diterima</h3>
                  <p className="text-xs text-[#877575] leading-relaxed">
                    Apakah Anda yakin sudah menerima seluruh barang pesanan Anda dengan kondisi lengkap, aman, dan memuaskan?
                  </p>
                </div>

                {/* Mini Item Summary */}
                <div className="bg-neutral-50/75 rounded-2xl p-4 text-left border border-neutral-100 space-y-1.5">
                  <span className="text-[8px] font-extrabold text-neutral-400 uppercase tracking-wider block">Ringkasan Paket</span>
                  <div className="max-h-[80px] overflow-y-auto space-y-1">
                    {currentOrderToConfirm.items.map((it: any, idx: number) => (
                      <p key={idx} className="text-xs font-bold text-neutral-700 truncate">
                        {it.name} <span className="text-primary font-black ml-1">x{it.quantity}</span>
                      </p>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-neutral-200/50 flex justify-between items-center text-xs font-extrabold text-neutral-800">
                    <span>Total Transaksi</span>
                    <span className="text-primary">Rp {new Intl.NumberFormat('id-ID').format(currentOrderToConfirm.totalAmount)}</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-rose-500 font-semibold italic bg-rose-50 rounded-xl p-2.5 border border-rose-100/50 leading-relaxed text-left">
                  *Penting: Setelah dikonfirmasi, transaksi ini dianggap selesai. Saldo Koperasi Anda tidak dapat dikembalikan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <button
                  onClick={() => setIsDeliveryConfirmModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Belum Menerima
                </button>
                <button
                  onClick={handleConfirmReceiptFinal}
                  className="flex-1 py-2.5 bg-[#ee4d2d] hover:bg-[#d83f20] text-white rounded-xl font-extrabold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Ya, Sudah Diterima
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
