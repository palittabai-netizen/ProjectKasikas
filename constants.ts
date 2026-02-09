
import { InvestmentPlan, UserRole, UserProfile, Transaction, TransactionType, TransactionStatus, Network } from './types';

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

export const REFERRAL_LEVELS = [
  { level: 1, percentage: 10 },
  { level: 2, percentage: 5 },
  { level: 3, percentage: 2 }
];
