
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  INTEREST = 'INTEREST',
  REFERRAL_COMMISSION = 'REFERRAL_COMMISSION',
  PLAN_PURCHASE = 'PLAN_PURCHASE'
}

export enum Network {
  BEP20 = 'USDT BEP20',
  TRC20 = 'USDT TRC20'
}

export interface InvestmentPlan {
  id: string;
  name: string;
  price: number;
  dailyInterestRate: number;
  durationDays: number;
  totalProfit: number;
  active: boolean;
}

export interface UserPlan {
  id: string;
  planId: string;
  name: string;
  investedAmount: number;
  dailyEarning: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'MATURED';
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  type: TransactionType;
  amount: number;
  network?: Network;
  status: TransactionStatus;
  txid?: string;
  address?: string;
  fee?: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  balance: number;
  lockedBalance: number;
  withdrawableAmount: number;
  referralCode: string;
  referredBy?: string;
}

// --- REFERRAL MODULE TYPES ---

export interface ReferralConfig {
  maxLevels: number;
  levelPercentages: number[]; // Index 0 = Level 1, Index 1 = Level 2, etc.
  active: boolean;
}

export interface ReferralCommission {
  id: string;
  sourceUserId: string;      // Who purchased the plan
  beneficiaryUserId: string; // Who gets the commission
  level: number;
  planName: string;
  baseAmount: number;
  percentage: number;
  commissionAmount: number;
  status: TransactionStatus;
  date: string;
}

export interface ReferralUser {
  id: string;
  username: string;
  dateJoined: string;
  uplinerId: string; // Direct referrer
  totalInvested: number;
  status: 'ACTIVE' | 'INACTIVE';
}