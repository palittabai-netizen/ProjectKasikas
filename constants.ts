
import { InvestmentPlan, UserRole, UserProfile, Transaction, TransactionType, TransactionStatus, Network, ReferralConfig, ReferralUser, ReferralCommission } from './types';

export const INITIAL_PLANS: InvestmentPlan[] = [
  {
    id: 'plan-1',
    name: 'Starter Yield',
    price: 100,
    dailyInterestRate: 1.5,
    durationDays: 30,
    totalProfit: 145,
    active: true
  },
  {
    id: 'plan-2',
    name: 'Pro Multiplier',
    price: 500,
    dailyInterestRate: 2.2,
    durationDays: 45,
    totalProfit: 995,
    active: true
  },
  {
    id: 'plan-3',
    name: 'Elite Wealth',
    price: 2500,
    dailyInterestRate: 3.5,
    durationDays: 60,
    totalProfit: 7750,
    active: true
  }
];

export const MOCK_USER: UserProfile = {
  id: 'user-1',
  username: 'CryptoInvestor88',
  role: UserRole.USER,
  balance: 1250.50,
  lockedBalance: 600,
  withdrawableAmount: 450.25,
  referralCode: 'YIELD-9941',
  referredBy: 'admin'
};

export const MOCK_ADMIN: UserProfile = {
  id: 'admin-1',
  username: 'GlobalAdmin',
  role: UserRole.ADMIN,
  balance: 99999.00,
  lockedBalance: 0,
  withdrawableAmount: 0,
  referralCode: 'ROOT-001'
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    userId: 'user-1',
    date: '2024-05-15 14:30:22',
    type: TransactionType.DEPOSIT,
    amount: 1000,
    network: Network.TRC20,
    status: TransactionStatus.COMPLETED,
    txid: 'TNVX...p7r2'
  },
  {
    id: 'tx-2',
    userId: 'user-1',
    date: '2024-05-16 09:00:00',
    type: TransactionType.PLAN_PURCHASE,
    amount: 500,
    status: TransactionStatus.COMPLETED
  },
  {
    id: 'tx-3',
    userId: 'user-1',
    date: '2024-05-17 00:05:00',
    type: TransactionType.INTEREST,
    amount: 11,
    status: TransactionStatus.COMPLETED
  }
];

// --- REFERRAL MOCK DATA ---

export const INITIAL_REFERRAL_CONFIG: ReferralConfig = {
  maxLevels: 3,
  levelPercentages: [10, 5, 2], // Level 1: 10%, Level 2: 5%, Level 3: 2%
  active: true
};

export const MOCK_REFERRAL_USERS: ReferralUser[] = [
  { id: 'user-2', username: 'DownlineAlpha', dateJoined: '2024-06-01', uplinerId: 'user-1', totalInvested: 500, status: 'ACTIVE' },
  { id: 'user-3', username: 'DownlineBeta', dateJoined: '2024-06-02', uplinerId: 'user-1', totalInvested: 100, status: 'ACTIVE' },
  { id: 'user-4', username: 'DownlineGamma', dateJoined: '2024-06-05', uplinerId: 'user-2', totalInvested: 1000, status: 'ACTIVE' }, // Level 2 for user-1
];

export const MOCK_COMMISSIONS: ReferralCommission[] = [
  {
    id: 'comm-1',
    sourceUserId: 'DownlineAlpha',
    beneficiaryUserId: 'user-1',
    level: 1,
    planName: 'Pro Multiplier',
    baseAmount: 500,
    percentage: 10,
    commissionAmount: 50,
    status: TransactionStatus.COMPLETED,
    date: '2024-06-01 10:00:00'
  },
  {
    id: 'comm-2',
    sourceUserId: 'DownlineGamma',
    beneficiaryUserId: 'user-1',
    level: 2,
    planName: 'Elite Wealth',
    baseAmount: 1000,
    percentage: 5,
    commissionAmount: 50,
    status: TransactionStatus.PENDING, // Needs approval
    date: '2024-06-05 14:20:00'
  }
];

export const REFERRAL_LEVELS = [
  { level: 1, percentage: 10 },
  { level: 2, percentage: 5 },
  { level: 3, percentage: 2 }
];