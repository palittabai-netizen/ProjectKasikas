import React, { useState } from 'react';
import { UserRole, InvestmentPlan, UserProfile, Transaction, TransactionType, TransactionStatus, Network } from './types';
import { INITIAL_PLANS, MOCK_USER, MOCK_ADMIN, MOCK_TRANSACTIONS, REFERRAL_LEVELS } from './constants';
import Layout from './components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
      txid: 'pending_tx_hash_123'
    },
    ...MOCK_TRANSACTIONS
  ]);

  // Admin UI States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [tempPlan, setTempPlan] = useState<Partial<InvestmentPlan>>({});

  // CRUD Handlers for Plans
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

  // Transaction Handlers
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

  const handleApproveTransaction = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // In a real app, update user balance here
    setTransactions(transactions.map(t => 
      t.id === txId ? { ...t, status: TransactionStatus.COMPLETED } : t
    ));
    alert("Transaction Approved");
  };

  const handleRejectTransaction = (txId: string) => {
    setTransactions(transactions.map(t => 
      t.id === txId ? { ...t, status: TransactionStatus.REJECTED } : t
    ));
    alert("Transaction Rejected");
  };

  const toggleRole = () => {
    const newRole = role === UserRole.USER ? UserRole.ADMIN : UserRole.USER;
    setRole(newRole);
    setProfile(newRole === UserRole.ADMIN ? MOCK_ADMIN : MOCK_USER);
    setActiveTab(newRole === UserRole.ADMIN ? 'admin-overview' : 'dashboard');
  };

  // Render Functions
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

        {/* Transactions Mini Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <button onClick={() => setActiveTab('history')} className="text-emerald-400 text-sm hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="text-sm hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 font-medium">{tx.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-mono font-semibold">{tx.amount} USDT</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === TransactionStatus.COMPLETED ? 'bg-emerald-950 text-emerald-400' : 
                        tx.status === TransactionStatus.PENDING ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tx.status}
                      </span>
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
                    <p className="text-xs text-slate-500">Min: 50 | Max: 5000 USDT</p>
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

  // ADMIN VIEW: Financial Approvals
  const renderApprovals = () => {
    const pendingTx = transactions.filter(t => t.status === TransactionStatus.PENDING);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
         <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white">Pending Approvals</h3>
            <p className="text-sm text-slate-500">Manage pending deposits and withdrawals.</p>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendingTx.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No pending transactions found.
                    </td>
                  </tr>
                ) : (
                  pendingTx.map((tx) => (
                    <tr key={tx.id} className="text-sm hover:bg-slate-800/30">
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="px-6 py-4 text-white font-medium">{tx.userId}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tx.type === TransactionType.DEPOSIT ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-900/30 text-amber-400'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">{tx.amount} USDT</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleApproveTransaction(tx.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectTransaction(tx.id)}
                          className="bg-red-900/50 hover:bg-red-900 text-red-400 border border-red-900 px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
         </div>
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