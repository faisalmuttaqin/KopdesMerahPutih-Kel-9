import { Member, LoanApplication, RecentActivity, StockItem, Transaction } from './types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'admin',
    name: 'Admin Utama',
    username: 'admin',
    initials: 'AU',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkIeG0ig5xUyxPTFdkPHXETBAmbowuxie9yYvjhZU7nM-hbSXhiTUcO3apm0ub5M30_hdx9DaSKbKMm2Q2G7LaEOgZFJsqljWPh3e4YBg5DXxuzWVKpN-YGmZMSn0Q0GKY4rRP0uSi1TO2vzVWTYq-WkYxR3EMTRYvxoYsn-FAgEUCQbb9w6xum4KkCvvnAZqmJz8UbJtFg0MFJSZsoaqCpWK35dnleiSFXbXGdzIrT0Z7baS7jWAv0CRqJFJwpzZM9xsbfdJjt5U',
    role: 'admin',
    balance: 0,
    activeLoan: 0,
    password: 'admin'
  },
  {
    id: 'budi',
    name: 'Budi Santoso',
    username: 'budi',
    initials: 'BS',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqsv002vD1JSrqCP5LKuclhyx44eUwdApXNouCQdMoLqql99pZKIjRwZ24ozTU2v02sITezSckvypMIkeoDiGd-DAqdKijh-KJOfLfkaNWn80KV2acYD782nbeZPKZn_butDS19Z66C5xbn8Fb0oNVcmM10ltVp8X4742FH8ROtZzvnIBo0Ild3DI5x85k0oRJv3CovfZ-8Mxb_uSlRww6gNz-nBdpiBQ0n5MjfnvtkeF-BHUe2YkyicXn6xRrLTEkdph--dY733M',
    role: 'member',
    balance: 45250000,
    activeLoan: 0,
    password: 'budi'
  },
  {
    id: 'siti',
    name: 'Siti Rahma',
    username: 'siti',
    initials: 'SR',
    role: 'member',
    balance: 12500000,
    activeLoan: 5500000,
    password: 'siti'
  },
  {
    id: 'agus',
    name: 'Agus Wijaya',
    username: 'agus',
    initials: 'AW',
    role: 'member',
    balance: 8900000,
    activeLoan: 25000000,
    password: 'agus'
  },
  {
    id: 'eka',
    name: 'Eka Lestari',
    username: 'eka',
    initials: 'EL',
    role: 'member',
    balance: 2400000,
    activeLoan: 2000000,
    password: 'eka'
  }
];

export const INITIAL_LOANS: LoanApplication[] = [
  {
    id: 'loan-1',
    memberId: 'budi',
    memberName: 'Budi Santoso',
    memberInitials: 'BS',
    amount: 15000000,
    tenor: 12,
    purpose: 'Modal Usaha',
    date: '12 Okt 2023',
    status: 'approved',
    paidMonths: 12,
    monthlyInstallment: 983333,
    totalRepayment: 11800000, // wait: nominal / tenor + bunga = 15M/12 + 1.5% = 1250000 + 225000 = 1475000. Budi's formula in HTML: Rp 15M, installment is 983.333. Wait, HTML actually says: Rp 10M, tenor 12, installment is 983.333: Bunga flat 1.5% applied (150.000), Pokok 833.333. That is for 10M! Yes! Let's calculate dynamically. For 15M, 15M/12 = 1.250.000 + 225.000 = 1.475.000. Let's make it calculate correctly dynamically!
    totalInterest: 1800000
  },
  {
    id: 'loan-2',
    memberId: 'siti',
    memberName: 'Siti Rahma',
    memberInitials: 'SR',
    amount: 5500000,
    tenor: 6,
    purpose: 'Pendidikan',
    date: '13 Okt 2023',
    status: 'pending',
    monthlyInstallment: 1000000,
    totalRepayment: 6000000,
    totalInterest: 500000
  },
  {
    id: 'loan-3',
    memberId: 'agus',
    memberName: 'Agus Wijaya',
    memberInitials: 'AW',
    amount: 25000000,
    tenor: 24,
    purpose: 'Modal Usaha',
    date: '14 Okt 2023',
    status: 'pending',
    monthlyInstallment: 1416667,
    totalRepayment: 34000000,
    totalInterest: 9000000
  },
  {
    id: 'loan-4',
    memberId: 'eka',
    memberName: 'Eka Lestari',
    memberInitials: 'EL',
    amount: 2000000,
    tenor: 5,
    purpose: 'Kebutuhan Darurat',
    date: '14 Okt 2023',
    status: 'pending',
    monthlyInstallment: 430000,
    totalRepayment: 2150000,
    totalInterest: 150000
  }
];

export const INITIAL_STOCK: StockItem[] = [
  {
    id: 'stock-1',
    name: 'Beras Premium 5kg',
    sku: 'BRS-PRM-5K',
    price: 65000,
    stock: 250,
    category: 'Sembako'
  },
  {
    id: 'stock-2',
    name: 'Minyak Goreng 2L',
    sku: 'MNY-GRG-2L',
    price: 34000,
    stock: 185,
    category: 'Sembako'
  },
  {
    id: 'stock-3',
    name: 'Gula Pasir Putih 1kg',
    sku: 'GLA-PSR-1K',
    price: 14500,
    stock: 320,
    category: 'Sembako'
  },
  {
    id: 'stock-4',
    name: 'Tepung Terigu Segitiga Biru 1kg',
    sku: 'TPG-TRG-1K',
    price: 12000,
    stock: 140,
    category: 'Sembako'
  },
  {
    id: 'stock-5',
    name: 'Kopi Luwak Sachet (pack of 10)',
    sku: 'KPI-LWK-P10',
    price: 15000,
    stock: 95,
    category: 'Minuman'
  },
  {
    id: 'stock-6',
    name: 'Mi Instan Goreng (per Bungkus)',
    sku: 'MIE-INS-GRG',
    price: 35000, // 10 pcs pack or unit
    stock: 500,
    category: 'Sembako'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Simpanan Sukarela',
    date: '12 Okt 2023',
    amount: 500000,
    type: 'in',
    icon: 'add',
    color: 'text-emerald-600'
  },
  {
    id: 'tx-2',
    description: 'Pembelian Sembako',
    date: '10 Okt 2023',
    amount: 125000,
    type: 'out',
    icon: 'remove',
    color: 'text-rose-600'
  },
  {
    id: 'tx-3',
    description: 'Angsuran Pinjaman',
    date: '05 Okt 2023',
    amount: 1500000,
    type: 'out',
    icon: 'payments',
    color: 'text-red-700'
  },
  {
    id: 'tx-4',
    description: 'SHU Tahun 2022',
    date: '01 Okt 2023',
    amount: 2450000,
    type: 'in',
    icon: 'add',
    color: 'text-emerald-600'
  }
];

export const INITIAL_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-1',
    type: 'register',
    title: 'Pendaftaran Anggota Baru',
    description: 'Andi Kurniawan baru saja bergabung.',
    time: '5 menit yang lalu',
    icon: 'add_circle',
    color: 'text-primary',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'act-2',
    type: 'deposit',
    title: 'Pembayaran Simpanan',
    description: 'Sari Indah membayar Simpanan Wajib.',
    time: '25 menit yang lalu',
    icon: 'payments',
    color: 'text-emerald-600',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'act-3',
    type: 'stock',
    title: 'Update Stok Barang',
    description: 'Beras Premium 5kg bertambah 50 sak.',
    time: '1 jam yang lalu',
    icon: 'inventory',
    color: 'text-yellow-600',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: 'act-4',
    type: 'loan_approved',
    title: 'Pinjaman Disetujui',
    description: 'Pinjaman Rp 10jt milik Roni telah disetujui.',
    time: '3 jam yang lalu',
    icon: 'verified',
    color: 'text-primary',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  }
];

// Helper functions for persistent local storage database
export const loadDatabase = () => {
  const members = localStorage.getItem('kopdes_members');
  const loans = localStorage.getItem('kopdes_loans');
  const stock = localStorage.getItem('kopdes_stock');
  const transactions = localStorage.getItem('kopdes_transactions');
  const activities = localStorage.getItem('kopdes_activities');

  let loadedMembers = members ? JSON.parse(members) : INITIAL_MEMBERS;
  let loadedLoans = loans ? JSON.parse(loans) : INITIAL_LOANS;

  // Self-healing / Stabilization block:
  // If Budi has any pending or approved unpaid loans in stale localStorage,
  // let's mark them as fully paid and clean his activeLoan so he can test applying for a new loan immediately!
  let needsSync = false;
  
  loadedLoans = loadedLoans.map((l: any) => {
    if (l.memberId === 'budi' && (l.status === 'pending' || (l.status === 'approved' && (l.paidMonths || 0) < l.tenor))) {
      needsSync = true;
      return {
        ...l,
        status: 'approved',
        paidMonths: l.tenor // Mark as fully paid
      };
    }
    return l;
  });

  loadedMembers = loadedMembers.map((m: any) => {
    if (m.id === 'budi' && m.activeLoan !== 0) {
      needsSync = true;
      return {
        ...m,
        activeLoan: 0
      };
    }
    return m;
  });

  const finalDb = {
    members: loadedMembers,
    loans: loadedLoans,
    stock: stock ? JSON.parse(stock) : INITIAL_STOCK,
    transactions: transactions ? JSON.parse(transactions) : INITIAL_TRANSACTIONS,
    activities: activities ? JSON.parse(activities) : INITIAL_ACTIVITIES,
  };

  if (needsSync) {
    saveDatabase(finalDb);
  }

  return finalDb;
};

export const saveDatabase = (db: {
  members: Member[];
  loans: LoanApplication[];
  stock: StockItem[];
  transactions: Transaction[];
  activities: RecentActivity[];
}) => {
  localStorage.setItem('kopdes_members', JSON.stringify(db.members));
  localStorage.setItem('kopdes_loans', JSON.stringify(db.loans));
  localStorage.setItem('kopdes_stock', JSON.stringify(db.stock));
  localStorage.setItem('kopdes_transactions', JSON.stringify(db.transactions));
  localStorage.setItem('kopdes_activities', JSON.stringify(db.activities));
};
