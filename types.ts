
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
}

export interface Referral {
  id: string;
  username: string;
  level: number;
  dateJoined: string;
  totalInvested: number;
  earnings: number;
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
