import React, { useState } from 'react';
import { UserRole, InvestmentPlan, UserProfile, Transaction, TransactionType, TransactionStatus, Network } from './types';
import { INITIAL_PLANS, MOCK_USER, MOCK_ADMIN, MOCK_TRANSACTIONS, REFERRAL_LEVELS } from './constants';
import Layout from './components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// System Constants
const MIN_WITHDRAWAL = 50;
const MAX_WITHDRAWAL = 5000;
const DEPOSIT_ADDRESS_TRC20 = "TYD4...8jK2 (TRC20)";
const DEPOSIT_ADDRESS_BEP20 = "0x7a...9d21 (BEP20)";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [plans, setPlans] = useState<InvestmentPlan[]>(INITIAL_PLANS);
  const [profile, setProfile] = useState<UserProfile>(MOCK_USER);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-pending-1',
      userId: 'user-pending-1',
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: TransactionType.DEPOSIT,
      amount: 5000,
      network: Network.TRC20,
      status: TransactionStatus.PENDING,
      txid: 'pending_tx_hash_123',
      notes: 'Initial large deposit'
    },
    ...MOCK_TRANSACTIONS
  ]);

  // User UI States - Wallet
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(Network.TRC20);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxId, setDepositTxId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  // Admin UI States - Plans
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [tempPlan, setTempPlan] = useState<Partial<InvestmentPlan>>({});

  // Admin UI States - Financial Approvals
  const [financialTab, setFinancialTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [tempTx, setTempTx] = useState<Partial<Transaction>>({});
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('ALL');
  const [shouldUpdateWallet, setShouldUpdateWallet] = useState(true);

  // --- HANDLERS: User Wallet Actions ---

  const handleUserDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: profile.id,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: TransactionType.DEPOSIT,
      amount: Number(depositAmount),
      network: selectedNetwork,
      status: TransactionStatus.PENDING,
      txid: depositTxId || 'PENDING_USER_INPUT'
    };

    setTransactions([newTx, ...transactions]);
    setDepositAmount('');
    setDepositTxId('');
    alert("Deposit request submitted successfully! Waiting for admin approval.");
  };

  const handleUserWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (amount < MIN_WITHDRAWAL) {
      alert(`Minimum withdrawal is ${MIN_WITHDRAWAL} USDT`);
      return;
    }
    if (amount > MAX_WITHDRAWAL) {
      alert(`Maximum withdrawal is ${MAX_WITHDRAWAL} USDT`);
      return;
    }
    if (amount > profile.balance) {
      alert("Insufficient available balance.");
      return;
    }
    if (!withdrawAddress) {
      alert("Please enter a destination address.");
      return;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: profile.id,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: TransactionType.WITHDRAWAL,
      amount: amount,
      network: selectedNetwork,
      status: TransactionStatus.PENDING,
      address: withdrawAddress,
      fee: 1 // Simulated fee
    };

    // SYNC LOGIC: Move funds to Locked Balance immediately
    setProfile(prev => ({
      ...prev,
      balance: prev.balance - amount,
      lockedBalance: prev.lockedBalance + amount
    }));

    setTransactions([newTx, ...transactions]);
    setWithdrawAmount('');
    setWithdrawAddress('');
    alert("Withdrawal requested! Funds have been locked until approval.");
  };

  // --- HANDLERS: Admin Actions ---

  const handleApproveTransaction = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Update Transaction Status
    setTransactions(transactions.map(t => 
      t.id === txId ? { ...t, status: TransactionStatus.COMPLETED } : t
    ));

    // Update User Balance (Mock Logic)
    if (tx.userId === MOCK_USER.id) {
       if (tx.type === TransactionType.DEPOSIT) {
          // Add to balance
          setProfile(prev => ({ ...prev, balance: prev.balance + tx.amount }));
       } else if (tx.type === TransactionType.WITHDRAWAL) {
          // Funds were already moved to locked on request. 
          // On approval (Complete), we remove them from locked (burn them from system).
          setProfile(prev => ({ ...prev, lockedBalance: prev.lockedBalance - tx.amount }));
       }
    }
    alert("Transaction Approved & Processed");
  };

  const handleRejectTransaction = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    setTransactions(transactions.map(t => 
      t.id === txId ? { ...t, status: TransactionStatus.REJECTED } : t
    ));

    // Refund logic for withdrawals
    if (tx.userId === MOCK_USER.id) {
      if (tx.type === TransactionType.WITHDRAWAL) {
        // Return locked funds to available balance
        setProfile(prev => ({ 
          ...prev, 
          lockedBalance: prev.lockedBalance - tx.amount,
          balance: prev.balance + tx.amount
        }));
      }
    }
    alert("Transaction Rejected. Funds returned if applicable.");
  };

  // --- HANDLERS: Plan Actions ---

  const handleOpenPlanModal = (plan?: InvestmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setTempPlan(plan);
    } else {
      setEditingPlan(null);
      setTempPlan({
        name: '',
        price: 0,
        dailyInterestRate: 0,
        durationDays: 0,
        totalProfit: 0,
        active: true
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPlan.name || !tempPlan.price) return;

    const newPlanData = {
      ...tempPlan,
      totalProfit: Number((Number(tempPlan.price) * (Number(tempPlan.dailyInterestRate) / 100) * Number(tempPlan.durationDays)).toFixed(2)) + Number(tempPlan.price),
      id: editingPlan ? editingPlan.id : `plan-${Date.now()}`
    } as InvestmentPlan;

    if (editingPlan) {
      setPlans(plans.map(p => p.id === editingPlan.id ? newPlanData : p));
    } else {
      setPlans([...plans, newPlanData]);
    }
    setIsPlanModalOpen(false);
  };

  const handleDeletePlan = (id: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  const handleTogglePlanStatus = (id: string) => {
    setPlans(plans.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handlePurchase = (plan: InvestmentPlan) => {
    if (profile.balance < plan.price) {
      alert("Insufficient Balance! Please deposit USDT.");
      return;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: profile.id,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: TransactionType.PLAN_PURCHASE,
      amount: plan.price,
      status: TransactionStatus.COMPLETED
    };

    setTransactions([newTx, ...transactions]);
    setProfile(prev => ({
      ...prev,
      balance: prev.balance - plan.price,
      lockedBalance: prev.lockedBalance + plan.price,
    }));
    alert(`Success! You have purchased the ${plan.name} plan.`);
  };

  // --- HANDLERS: Admin Manual Entry ---

  const handleOpenTxModal = (tx?: Transaction, type?: TransactionType) => {
    if (tx) {
      setEditingTx(tx);
      setTempTx(tx);
    } else {
      setEditingTx(null);
      setTempTx({
        userId: '',
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: type || (financialTab === 'deposits' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL),
        amount: 0,
        network: Network.TRC20,
        status: TransactionStatus.PENDING,
        txid: '',
        address: '',
        fee: 0,
        notes: ''
      });
    }
    setShouldUpdateWallet(true);
    setIsTxModalOpen(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTx.userId || !tempTx.amount) return;

    const newTxData = {
      ...tempTx,
      id: editingTx ? editingTx.id : `tx-${Date.now()}`
    } as Transaction;

    let updatedTransactions = [...transactions];
    if (editingTx) {
      updatedTransactions = transactions.map(t => t.id === editingTx.id ? newTxData : t);
    } else {
      updatedTransactions = [newTxData, ...transactions];
    }
    setTransactions(updatedTransactions);

    // Manual Admin Wallet Logic
    if (shouldUpdateWallet && newTxData.userId === MOCK_USER.id) {
        if (newTxData.status === TransactionStatus.APPROVED || newTxData.status === TransactionStatus.COMPLETED) {
             if (newTxData.type === TransactionType.DEPOSIT) {
                setProfile(prev => ({ ...prev, balance: prev.balance + Number(newTxData.amount) }));
             } else if (newTxData.type === TransactionType.WITHDRAWAL) {
                setProfile(prev => ({ ...prev, balance: prev.balance - Number(newTxData.amount) }));
             }
        }
    }
    setIsTxModalOpen(false);
  };

  const handleDeleteTx = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const toggleRole = () => {
    const newRole = role === UserRole.USER ? UserRole.ADMIN : UserRole.USER;
    setRole(newRole);
    setProfile(newRole === UserRole.ADMIN ? MOCK_ADMIN : MOCK_USER);
    setActiveTab(newRole === UserRole.ADMIN ? 'admin-overview' : 'dashboard');
  };

  // --- RENDER FUNCTIONS ---

  const renderDashboard = () => {
    const chartData = [
      { name: 'Mon', yield: 400 },
      { name: 'Tue', yield: 1200 },
      { name: 'Wed', yield: 900 },
      { name: 'Thu', yield: 1800 },
      { name: 'Fri', yield: 1600 },
      { name: 'Sat', yield: 2100 },
      { name: 'Sun', yield: 2800 },
    ];

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Invested', value: `${profile.lockedBalance} USDT`, icon: '💰', color: 'text-blue-400' },
            { label: 'Total Earnings', value: '450.25 USDT', icon: '📈', color: 'text-emerald-400' },
            { label: 'Daily Interest', value: '18.50 USDT', icon: '⚡', color: 'text-amber-400' },
            { label: 'Withdrawable', value: `${profile.balance} USDT`, icon: '🔓', color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <h3 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Chart and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-6 text-white">Profit Analytics (Last 7 Days)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="yield" stroke="#10b981" fillOpacity={1} fill="url(#colorYield)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white">Market Trends</h3>
              </div>
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "The current market volatility suggests a stable yield environment. Our Pro Multiplier plan is currently performing at peak efficiency."
              </p>
            </div>
            <div className="mt-6">
               <div className="bg-slate-900/50 p-4 rounded-xl">
                 <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-widest">Referral Link</p>
                 <div className="flex items-center justify-between">
                   <code className="text-emerald-400 font-mono text-sm">{profile.referralCode}</code>
                   <button onClick={() => alert("Copied!")} className="text-slate-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                   </button>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Transactions Mini Table - Last 10 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <button onClick={() => setActiveTab('history')} className="text-emerald-400 text-sm hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Network</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Ref/TXID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="text-sm hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 font-medium capitalize">{tx.type.replace('_', ' ').toLowerCase()}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{tx.network || '-'}</td>
                    <td className={`px-6 py-4 font-mono font-bold ${
                      tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.INTEREST ? 'text-emerald-400' : 
                      tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.PLAN_PURCHASE ? 'text-red-400' : 'text-white'
                    }`}>
                      {tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.INTEREST ? '+' : '-'}{tx.amount} USDT
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === TransactionStatus.COMPLETED ? 'bg-emerald-950 text-emerald-400' : 
                        tx.status === TransactionStatus.PENDING ? 'bg-amber-950 text-amber-400' : 
                        tx.status === TransactionStatus.REJECTED ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 truncate max-w-[100px]">
                        {tx.txid || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderWallet = () => {
    // Filter transactions for history specific to wallet actions
    const walletHistory = transactions.filter(t => 
      t.type === TransactionType.DEPOSIT || t.type === TransactionType.WITHDRAWAL
    );

    return (
      <div className="space-y-6">
        {/* Wallet Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.29 0 2.13-.81 2.13-1.88 0-1.09-.86-1.72-2.77-2.18-2.05-.5-3.2-1.5-3.2-3.21 0-1.72 1.27-3.19 2.63-3.48V4h2.67v1.92c1.47.33 2.76 1.3 3.03 3.1h-1.95c-.19-.94-1.01-1.63-2.11-1.63-1.12 0-2 .81-2 1.83 0 1.06.77 1.58 2.85 2.05 2.18.52 3.12 1.63 3.12 3.32 0 1.83-1.25 3.33-2.96 3.58z"/></svg>
             </div>
             <p className="text-sm font-medium text-slate-400">Available Balance</p>
             <h3 className="text-3xl font-bold text-white mt-2">{profile.balance.toFixed(2)} USDT</h3>
             <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-400">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               <span>Ready for withdrawal</span>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
             </div>
             <p className="text-sm font-medium text-slate-400">Locked Balance</p>
             <h3 className="text-3xl font-bold text-white mt-2">{profile.lockedBalance.toFixed(2)} USDT</h3>
             <div className="mt-4 flex items-center space-x-2 text-xs text-amber-400">
               <span className="w-2 h-2 rounded-full bg-amber-500"></span>
               <span>Active in plans / Pending withdrawal</span>
             </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-800/50 p-6 rounded-2xl relative overflow-hidden">
             <p className="text-sm font-medium text-emerald-200">Total Asset Value</p>
             <h3 className="text-3xl font-bold text-white mt-2">{(profile.balance + profile.lockedBalance).toFixed(2)} USDT</h3>
             <p className="text-xs text-emerald-300/60 mt-4">Combined Portfolio Value</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           {/* Actions Panel (Deposit/Withdraw) */}
           <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex border-b border-slate-800">
                 <button 
                   onClick={() => setWalletTab('deposit')}
                   className={`flex-1 py-4 text-center font-bold text-sm uppercase transition-colors ${walletTab === 'deposit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                 >
                   Deposit
                 </button>
                 <button 
                   onClick={() => setWalletTab('withdraw')}
                   className={`flex-1 py-4 text-center font-bold text-sm uppercase transition-colors ${walletTab === 'withdraw' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                 >
                   Withdraw
                 </button>
              </div>

              <div className="p-6 md:p-8">
                {walletTab === 'deposit' ? (
                  <form onSubmit={handleUserDeposit} className="space-y-6">
                    <div>
                       <label className="block text-sm font-medium text-slate-400 mb-2">Select Network</label>
                       <div className="flex space-x-4">
                          <button 
                            type="button"
                            onClick={() => setSelectedNetwork(Network.TRC20)}
                            className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${selectedNetwork === Network.TRC20 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                          >
                            TRC20
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSelectedNetwork(Network.BEP20)}
                            className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${selectedNetwork === Network.BEP20 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                          >
                            BEP20
                          </button>
                       </div>
                    </div>

                    <div className="bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center border border-slate-800">
                       <div className="w-40 h-40 bg-white p-2 rounded-lg mb-4 flex items-center justify-center">
                          {/* Mock QR Code Placeholder */}
                          <div className="w-full h-full bg-slate-200 grid grid-cols-6 gap-1 p-1">
                             {Array.from({ length: 36 }).map((_, i) => (
                               <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-10'} rounded-sm`}></div>
                             ))}
                          </div>
                       </div>
                       <p className="text-xs text-slate-500 mb-2">Deposit Address ({selectedNetwork})</p>
                       <div className="flex items-center space-x-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 w-full max-w-sm">
                          <code className="text-emerald-400 text-xs sm:text-sm font-mono truncate flex-1">
                             {selectedNetwork === Network.TRC20 ? DEPOSIT_ADDRESS_TRC20 : DEPOSIT_ADDRESS_BEP20}
                          </code>
                          <button type="button" onClick={() => alert("Address copied!")} className="text-slate-400 hover:text-white">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Deposit Amount (USDT)</label>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Transaction ID (Hash)</label>
                          <input 
                            type="text" 
                            placeholder="Enter TXID..." 
                            value={depositTxId}
                            onChange={(e) => setDepositTxId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
                          />
                       </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all"
                    >
                      I Have Sent Payment
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleUserWithdrawal} className="space-y-6">
                     <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-xl flex items-start gap-3">
                        <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <div>
                           <h4 className="text-sm font-bold text-amber-400">Important Notice</h4>
                           <p className="text-xs text-amber-200/70 mt-1">
                              Funds requested for withdrawal will be immediately moved to your Locked Balance until processed. 
                              Minimum withdrawal: {MIN_WITHDRAWAL} USDT.
                           </p>
                        </div>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-slate-400 mb-2">Select Network</label>
                       <div className="flex space-x-4">
                          <button 
                            type="button"
                            onClick={() => setSelectedNetwork(Network.TRC20)}
                            className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${selectedNetwork === Network.TRC20 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                          >
                            TRC20
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSelectedNetwork(Network.BEP20)}
                            className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${selectedNetwork === Network.BEP20 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                          >
                            BEP20
                          </button>
                       </div>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-400 mb-2">Withdrawal Amount (USDT)</label>
                       <div className="relative">
                         <input 
                            type="number" 
                            placeholder="0.00" 
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-mono pr-20"
                          />
                          <button 
                             type="button"
                             onClick={() => setWithdrawAmount(profile.balance.toString())}
                             className="absolute right-3 top-3 text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase"
                          >
                             Max
                          </button>
                       </div>
                       <p className="text-right text-xs text-slate-500 mt-2">Available: {profile.balance.toFixed(2)} USDT</p>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-400 mb-2">Destination Address</label>
                       <input 
                         type="text" 
                         placeholder="Enter wallet address..." 
                         value={withdrawAddress}
                         onChange={(e) => setWithdrawAddress(e.target.value)}
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                       />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-emerald-600 border border-slate-700 hover:border-emerald-600 transition-all"
                    >
                      Request Withdrawal
                    </button>
                  </form>
                )}
              </div>
           </div>

           {/* Recent Wallet History */}
           <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-800">
                 <h3 className="text-lg font-bold text-white">Wallet History</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[500px]">
                 {walletHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No deposits or withdrawals yet.</div>
                 ) : (
                    <div className="divide-y divide-slate-800">
                       {walletHistory.map(tx => (
                          <div key={tx.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                             <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${tx.type === TransactionType.DEPOSIT ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                   {tx.type}
                                </span>
                                <span className="text-xs text-slate-500">{tx.date}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="font-mono font-bold text-white text-lg">{tx.amount} USDT</span>
                                <span className={`text-xs font-bold uppercase ${
                                   tx.status === TransactionStatus.COMPLETED ? 'text-emerald-500' : 
                                   tx.status === TransactionStatus.PENDING ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                   {tx.status}
                                </span>
                             </div>
                             <div className="mt-2 text-xs text-slate-500 flex justify-between">
                                <span>{tx.network}</span>
                                <span className="font-mono">{tx.txid ? `${tx.txid.substring(0, 8)}...` : 'Processing'}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderPlans = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.filter(p => p.active).map((plan) => (
        <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all group">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <span className="text-emerald-400 font-bold text-xs">+{plan.dailyInterestRate}% DAILY</span>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Plan Price</span>
                <span className="text-white font-bold">{plan.price} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Duration</span>
                <span className="text-white">{plan.durationDays} Days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Profit</span>
                <span className="text-emerald-400 font-bold">{plan.totalProfit} USDT</span>
              </div>
            </div>

            <button 
              onClick={() => handlePurchase(plan)}
              className="w-full py-4 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white font-bold transition-all group-hover:bg-emerald-600"
            >
              Invest Now
            </button>
          </div>
          <div className="bg-slate-800/50 px-8 py-3 flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <span>Instant Activation</span>
            <span className="text-emerald-500">● Live</span>
          </div>
        </div>
      ))}
    </div>
  );

  // ADMIN VIEW: System Overview
  const renderAdminOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '1,284', icon: '👥' },
          { label: 'Total Deposits', value: '45,200 USDT', icon: '🏦' },
          { label: 'Pending W/D', value: transactions.filter(t => t.status === TransactionStatus.PENDING).length.toString(), icon: '⏳' },
          { label: 'System Balance', value: '122,890 USDT', icon: '💎' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">System Configuration</h3>
            </div>
            <div className="space-y-4">
               <div className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Automatic Deposits</p>
                    <p className="text-xs text-slate-500">Bypass manual approval for new transactions</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
               </div>
               <div className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Withdrawal Limit</p>
                    <p className="text-xs text-slate-500">Min: {MIN_WITHDRAWAL} | Max: {MAX_WITHDRAWAL} USDT</p>
                  </div>
                  <button onClick={() => setActiveTab('settings')} className="text-emerald-400 text-xs font-bold uppercase">Edit</button>
               </div>
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Referral Tiers</h3>
            <div className="space-y-4">
               {REFERRAL_LEVELS.map(lvl => (
                 <div key={lvl.level} className="flex items-center justify-between p-3 border-b border-slate-800 last:border-0">
                    <span className="text-sm font-medium">Level {lvl.level}</span>
                    <span className="text-emerald-400 font-bold">{lvl.percentage}%</span>
                 </div>
               ))}
               <button onClick={() => setActiveTab('settings')} className="w-full mt-4 py-2 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors">
                 Manage Tiers
               </button>
            </div>
         </div>
      </div>
    </div>
  );

  // ADMIN VIEW: Manage Plans (CRUD)
  const renderManagePlans = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Investment Plans</h3>
        <button 
          onClick={() => handleOpenPlanModal()} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
        >
          + Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-slate-900 border ${plan.active ? 'border-slate-800' : 'border-red-900/50 opacity-70'} rounded-2xl overflow-hidden p-6 relative`}>
            {!plan.active && <div className="absolute top-4 right-4 text-xs font-bold text-red-500 uppercase border border-red-500 px-2 py-1 rounded">Inactive</div>}
            
            <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
            <div className="text-3xl font-bold text-emerald-400 mb-6">{plan.price} USDT</div>
            
            <div className="space-y-2 text-sm text-slate-400 mb-6">
              <div className="flex justify-between"><span>ROI:</span> <span className="text-white">{plan.dailyInterestRate}% Daily</span></div>
              <div className="flex justify-between"><span>Duration:</span> <span className="text-white">{plan.durationDays} Days</span></div>
              <div className="flex justify-between"><span>Total Return:</span> <span className="text-white">{plan.totalProfit} USDT</span></div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleTogglePlanStatus(plan.id)}
                className={`col-span-1 py-2 rounded-lg text-xs font-bold uppercase ${plan.active ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-emerald-900 text-emerald-400'}`}
              >
                {plan.active ? 'Disable' : 'Enable'}
              </button>
              <button 
                onClick={() => handleOpenPlanModal(plan)}
                className="col-span-1 bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDeletePlan(plan.id)}
                className="col-span-1 bg-slate-800 hover:bg-red-600 hover:text-white text-red-400 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Name</label>
                <input 
                  type="text" 
                  value={tempPlan.name} 
                  onChange={e => setTempPlan({...tempPlan, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (USDT)</label>
                  <input 
                    type="number" 
                    value={tempPlan.price} 
                    onChange={e => setTempPlan({...tempPlan, price: Number(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Daily ROI (%)</label>
                  <input 
                    type="number" step="0.1"
                    value={tempPlan.dailyInterestRate} 
                    onChange={e => setTempPlan({...tempPlan, dailyInterestRate: Number(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Days)</label>
                  <input 
                    type="number" 
                    value={tempPlan.durationDays} 
                    onChange={e => setTempPlan({...tempPlan, durationDays: Number(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ADMIN VIEW: Financial Approvals (Refactored)
  const renderApprovals = () => {
    // Filter Transactions based on Tabs and Search
    const filteredTransactions = transactions.filter(t => {
      const isDeposit = financialTab === 'deposits' && t.type === TransactionType.DEPOSIT;
      const isWithdrawal = financialTab === 'withdrawals' && t.type === TransactionType.WITHDRAWAL;
      const matchesType = isDeposit || isWithdrawal;
      const matchesSearch = t.userId.toLowerCase().includes(txSearch.toLowerCase()) || (t.txid && t.txid.toLowerCase().includes(txSearch.toLowerCase()));
      const matchesStatus = txStatusFilter === 'ALL' || t.status === txStatusFilter;
      return matchesType && matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6">
        {/* Module Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setFinancialTab('deposits')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${financialTab === 'deposits' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Deposits
            </button>
            <button 
              onClick={() => setFinancialTab('withdrawals')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${financialTab === 'withdrawals' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Withdrawals
            </button>
          </div>
          <button 
            onClick={() => handleOpenTxModal(undefined, financialTab === 'deposits' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 shadow-lg shadow-emerald-900/20"
          >
            <span>+ Manual Entry</span>
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-5 relative">
            <input 
              type="text" 
              placeholder="Search User ID or TXID..." 
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-emerald-500"
            />
            <svg className="absolute right-3 top-2.5 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div className="md:col-span-3">
             <select 
               value={txStatusFilter} 
               onChange={(e) => setTxStatusFilter(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-emerald-500"
             >
               <option value="ALL">All Status</option>
               <option value={TransactionStatus.PENDING}>Pending</option>
               <option value={TransactionStatus.APPROVED}>Approved</option>
               <option value={TransactionStatus.COMPLETED}>Completed</option>
               <option value={TransactionStatus.REJECTED}>Rejected</option>
             </select>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">User</th>
                    <th className="px-6 py-4 font-semibold">Network</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    {financialTab === 'withdrawals' && <th className="px-6 py-4 font-semibold">Fee</th>}
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="text-sm hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {tx.date}
                          {tx.txid && <div className="text-[10px] text-slate-600 font-mono mt-1 truncate max-w-[100px]">{tx.txid}</div>}
                        </td>
                        <td className="px-6 py-4 text-white font-medium">{tx.userId}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">{tx.network}</td>
                        <td className={`px-6 py-4 font-mono font-bold ${financialTab === 'deposits' ? 'text-emerald-400' : 'text-amber-400'}`}>
                           {financialTab === 'deposits' ? '+' : '-'}{tx.amount} USDT
                        </td>
                        {financialTab === 'withdrawals' && <td className="px-6 py-4 text-slate-400 text-xs">{tx.fee ? `${tx.fee} USDT` : '-'}</td>}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                            tx.status === TransactionStatus.COMPLETED ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900' : 
                            tx.status === TransactionStatus.APPROVED ? 'bg-blue-950/50 text-blue-400 border-blue-900' : 
                            tx.status === TransactionStatus.PENDING ? 'bg-amber-950/50 text-amber-400 border-amber-900' : 
                            'bg-red-950/50 text-red-400 border-red-900'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                             {tx.status === TransactionStatus.PENDING && (
                               <>
                                <button 
                                  onClick={() => handleApproveTransaction(tx.id)}
                                  className="p-1.5 rounded-lg bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/60 transition-colors"
                                  title="Approve"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                </button>
                                <button 
                                  onClick={() => handleRejectTransaction(tx.id)}
                                  className="p-1.5 rounded-lg bg-red-900/30 text-red-500 hover:bg-red-900/60 transition-colors"
                                  title="Reject"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                               </>
                             )}
                             <button 
                               onClick={() => handleOpenTxModal(tx)}
                               className="p-1.5 rounded-lg bg-slate-800 text-blue-400 hover:bg-slate-700 transition-colors"
                               title="Edit"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                             </button>
                             <button 
                               onClick={() => handleDeleteTx(tx.id)}
                               className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                               title="Delete"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Transaction Modal */}
        {isTxModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white">{editingTx ? 'Edit Transaction' : 'New Manual Entry'}</h3>
                <button onClick={() => setIsTxModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              
              <form onSubmit={handleSaveTx} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Common Fields */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User ID</label>
                    <input 
                      type="text" 
                      value={tempTx.userId} 
                      onChange={e => setTempTx({...tempTx, userId: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. user-1"
                      required
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select
                      value={tempTx.status}
                      onChange={e => setTempTx({...tempTx, status: e.target.value as TransactionStatus})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={TransactionStatus.PENDING}>PENDING</option>
                      <option value={TransactionStatus.APPROVED}>APPROVED</option>
                      <option value={TransactionStatus.COMPLETED}>COMPLETED</option>
                      <option value={TransactionStatus.REJECTED}>REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (USDT)</label>
                    <input 
                      type="number" 
                      value={tempTx.amount} 
                      onChange={e => setTempTx({...tempTx, amount: Number(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Network</label>
                    <select
                      value={tempTx.network}
                      onChange={e => setTempTx({...tempTx, network: e.target.value as Network})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={Network.TRC20}>TRC20</option>
                      <option value={Network.BEP20}>BEP20</option>
                    </select>
                  </div>

                  {/* Optional Fields */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transaction Hash (TXID)</label>
                    <input 
                      type="text" 
                      value={tempTx.txid || ''} 
                      onChange={e => setTempTx({...tempTx, txid: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                      placeholder="Optional blockchain hash"
                    />
                  </div>
                  
                  {/* Withdrawal Specifics */}
                  {financialTab === 'withdrawals' && (
                     <>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination Address</label>
                        <input 
                          type="text" 
                          value={tempTx.address || ''} 
                          onChange={e => setTempTx({...tempTx, address: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                          placeholder="Wallet Address"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fee (USDT)</label>
                        <input 
                          type="number" 
                          value={tempTx.fee || 0} 
                          onChange={e => setTempTx({...tempTx, fee: Number(e.target.value)})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                     </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Notes</label>
                    <textarea 
                      value={tempTx.notes || ''} 
                      onChange={e => setTempTx({...tempTx, notes: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 h-24"
                      placeholder="Internal notes..."
                    />
                  </div>
                </div>

                {/* Audit / Wallet Action */}
                {!editingTx && (
                   <div className="bg-slate-800/50 p-4 rounded-xl flex items-start gap-3 border border-slate-700/50">
                      <input 
                        type="checkbox" 
                        id="walletUpdate" 
                        checked={shouldUpdateWallet} 
                        onChange={e => setShouldUpdateWallet(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 bg-slate-700"
                      />
                      <div>
                        <label htmlFor="walletUpdate" className="block text-sm font-bold text-white">Apply Wallet Balance Change</label>
                        <p className="text-xs text-slate-400 mt-1">
                          If checked, this transaction will immediately {financialTab === 'deposits' ? 'credit' : 'debit'} the user's wallet balance upon saving (if status is Approved/Completed).
                        </p>
                      </div>
                   </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setIsTxModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-colors">
                    {editingTx ? 'Update Transaction' : 'Create Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ADMIN VIEW: Settings
  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6">
        <h3 className="text-lg font-bold text-white mb-6">Global Configuration</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Maintenance Mode</p>
              <p className="text-xs text-slate-500">Disable all user access temporarily</p>
            </div>
            <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full"></div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6">
            <label className="block text-sm font-medium text-slate-400 mb-2">Platform Name</label>
            <input type="text" defaultValue="USDT Yield Protocol" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6">
        <h3 className="text-lg font-bold text-white mb-6">Financial Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Min Deposit</label>
            <div className="relative">
              <input type="number" defaultValue="50" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white pl-10" />
              <span className="absolute left-3 top-3 text-slate-500">$</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Max Withdrawal</label>
            <div className="relative">
              <input type="number" defaultValue="5000" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white pl-10" />
              <span className="absolute left-3 top-3 text-slate-500">$</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold">Save Changes</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'plans': return renderPlans();
      case 'wallet': return renderWallet();
      
      // Admin Routes
      case 'admin-overview': return renderAdminOverview();
      case 'manage-plans': return renderManagePlans();
      case 'approvals': return renderApprovals();
      case 'settings': return renderSettings();
      
      default: return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
           <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
           <p className="text-lg font-medium">Coming Soon</p>
           <p className="text-sm">This module is under development.</p>
        </div>
      );
    }
  };

  return (
    <>
      <Layout 
        role={role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        username={profile.username}
      >
        {renderContent()}

        {/* Floating Action Button for Role Switching (Demo Purpose) */}
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={toggleRole}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-full shadow-2xl transition-all group"
          >
            <span className="text-xs font-bold text-slate-400 group-hover:text-white uppercase">Switch to {role === UserRole.USER ? 'Admin' : 'User'}</span>
            <div className={`w-3 h-3 rounded-full ${role === UserRole.USER ? 'bg-blue-500' : 'bg-red-500'}`}></div>
          </button>
        </div>
      </Layout>
    </>
  );
};

export default App;