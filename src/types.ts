export interface Member {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  balance: number; // Saldo simpanan
  activeLoan: number; // Total pinjaman aktif
  savingsTarget?: number;
  password?: string;
}

export interface LoanApplication {
  id: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  amount: number;
  tenor: number; // months or days
  tenorUnit?: 'bulan' | 'hari';
  purpose: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  monthlyInstallment: number;
  totalRepayment: number;
  totalInterest: number;
  paidMonths?: number;
}

export interface RecentActivity {
  id: string;
  type: 'register' | 'deposit' | 'stock' | 'loan_approved' | 'loan_submit' | 'purchase';
  title: string;
  description: string;
  time: string; // e.g., "5 menit yang lalu"
  icon: string; // lucide-react icon name or class name
  color: string; // e.g., "text-primary", "text-secondary", etc.
  timestamp: string; // ISO string or simple time
}

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: 'in' | 'out'; // 'in' = deposit/SHU, 'out' = purchase/installment
  icon: string;
  color: string;
}
