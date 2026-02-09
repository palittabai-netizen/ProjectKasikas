
import React, { useState, useEffect } from 'react';
import { UserRole, InvestmentPlan, UserProfile, Transaction, TransactionType, TransactionStatus, Network } from './types';
import { INITIAL_PLANS, MOCK_USER, MOCK_ADMIN, MOCK_TRANSACTIONS, REFERRAL_LEVELS } from './constants';
import Layout from './components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getInvestmentAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plans, setPlans] = useState<InvestmentPlan[]>(INITIAL_PLANS);
  const [profile, setProfile] = useState<UserProfile>(MOCK_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [aiInsight, setAiInsight] = useState<string>('Generating market analysis...');
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      const insight = await getInvestmentAdvice(profile, plans);
      setAiInsight(insight);
    };
    fetchInsight();
  }, []);

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

  const toggleRole = () => {
    const newRole = role === UserRole.USER ? UserRole.ADMIN : UserRole.USER;
    setRole(newRole);
    setProfile(newRole === UserRole.ADMIN ? MOCK_ADMIN : MOCK_USER);
    setActiveTab(newRole === UserRole.ADMIN ? 'admin-overview' : 'dashboard');
  };

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

        {/* AI Insight and Chart */}
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
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white">Yield Assistant</h3>
              </div>
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "{aiInsight}"
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
                    <td className="px-6 py-4 text-slate-400">{tx.date}</td>
                    <td className="px-6 py-4 font-medium">{tx.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-mono font-semibold">{tx.amount} USDT</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === TransactionStatus.COMPLETED ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
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

  const renderAdminOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '1,284', icon: '👥' },
          { label: 'Total Deposits', value: '45,200 USDT', icon: '🏦' },
          { label: 'Pending W/D', value: '12', icon: '⏳' },
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
                  <button className="text-emerald-400 text-xs font-bold uppercase">Edit</button>
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
               <button className="w-full mt-4 py-2 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors">
                 Add Level
               </button>
            </div>
         </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'plans': return renderPlans();
      case 'admin-overview': return renderAdminOverview();
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
        <div className="fixed bottom-6 right-6">
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
