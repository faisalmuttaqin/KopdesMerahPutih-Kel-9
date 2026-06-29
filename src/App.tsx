import React, { useState, useEffect } from 'react';
import { loadDatabase, saveDatabase } from './data';
import { Member, LoanApplication, StockItem, Transaction, RecentActivity } from './types';
import LoginView from './components/LoginView';
import AdminDashboard from './components/AdminDashboard';
import MemberDashboard from './components/MemberDashboard';
import LoanApplicationView from './components/LoanApplicationView';

export default function App() {
  const [db, setDb] = useState<{
    members: Member[];
    loans: LoanApplication[];
    stock: StockItem[];
    transactions: Transaction[];
    activities: RecentActivity[];
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'loan-calculator'>('dashboard');

  // Load database on mount
  useEffect(() => {
    const loaded = loadDatabase();
    setDb(loaded);

    // Optionally auto-login to make preview interactive immediately
    // We let users choose or type on the login screen, which is super beautiful!
  }, []);

  if (!db) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#474555] font-semibold text-sm">Menyiapkan Portal Koperasi...</p>
        </div>
      </div>
    );
  }

  // Persisted state updater
  const handleUpdateDatabase = (updatedData: {
    members?: Member[];
    loans?: LoanApplication[];
    stock?: StockItem[];
    transactions?: Transaction[];
    activities?: RecentActivity[];
  }) => {
    setDb((prev) => {
      if (!prev) return null;
      const next = {
        members: updatedData.members || prev.members,
        loans: updatedData.loans || prev.loans,
        stock: updatedData.stock || prev.stock,
        transactions: updatedData.transactions || prev.transactions,
        activities: updatedData.activities || prev.activities,
      };

      // Persist to local storage
      saveDatabase(next);

      // Keep currentUser state in sync if current profile records changed
      if (currentUser) {
        const freshUser = next.members.find((m) => m.id === currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }

      return next;
    });
  };

  const handleLogin = (user: Member) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleRegister = (newMember: Member) => {
    handleUpdateDatabase({
      members: [...db.members, newMember],
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'register',
          title: 'Anggota Baru Terdaftar',
          description: `${newMember.name} bergabung lewat pendaftaran online.`,
          time: 'Baru saja',
          color: 'text-primary',
          icon: 'person_add',
          timestamp: new Date().toISOString(),
        },
        ...db.activities,
      ],
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleSwitchRole = (roleId: string) => {
    const matchedUser = db.members.find((m) => m.id === roleId);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setCurrentView('dashboard');
    }
  };

  if (!currentUser) {
    return (
      <LoginView
        members={db.members}
        onLoginSuccess={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <>
      {currentUser.role === 'admin' ? (
        <AdminDashboard
          currentUser={currentUser}
          members={db.members}
          loans={db.loans}
          stock={db.stock}
          activities={db.activities}
          onLogout={handleLogout}
          onUpdateDatabase={handleUpdateDatabase}
          onSwitchRole={handleSwitchRole}
        />
      ) : (
        <>
          {currentView === 'dashboard' ? (
            <MemberDashboard
              currentUser={currentUser}
              members={db.members}
              loans={db.loans}
              stock={db.stock}
              transactions={db.transactions}
              activities={db.activities}
              onLogout={handleLogout}
              onUpdateDatabase={handleUpdateDatabase}
              onSwitchView={setCurrentView}
            />
          ) : (
            <LoanApplicationView
              currentUser={currentUser}
              loans={db.loans}
              activities={db.activities}
              onBackToDashboard={() => setCurrentView('dashboard')}
              onUpdateDatabase={handleUpdateDatabase}
            />
          )}
        </>
      )}
    </>
  );
}
