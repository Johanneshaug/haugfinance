export interface Asset {
  id: string;
  name: string;
  value: number;
  growthRate: number; // Annual percentage
  type: 'investment' | 'property' | 'cash' | 'stock' | 'other';
  stockSymbol?: string;
  quantity?: number;
  stockGrowthType?: 'rate' | 'targets'; // Growth calculation method for ALL assets
  stockTargets?: Array<{ date: string; expectedPrice: number }>; // Target dates with expected values
  useEstimation?: boolean; // Add this line
  distributionFrequency?: DistributionFrequency; // Added this line for per-asset setting
}

export interface Liability {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // Annual percentage
  minimumPayment: number;
  type: 'mortgage' | 'auto' | 'credit_card' | 'student' | 'other';
}

export interface Income {
  id: string;
  source: string;
  monthlyAmount: number;
  growthRate: number; // Annual percentage
  hasDateRange?: boolean; // Whether this income has start/end dates
  startDate?: string; // Start date for the income
  endDate?: string; // End date for the income
}

export interface Expense {
  id: string;
  category: string;
  monthlyAmount: number;
  growthRate: number; // Annual percentage (inflation)
}

export type DistributionFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface FinancialData {
  assets: Asset[];
  liabilities: Liability[];
  income: Income[];
  expenses: Expense[];
  investmentPercentage: number;
  investmentType?: 'stock' | 'cash' | 'rate';
  investmentRate?: number;
  investmentStockSymbol?: string;
  yearsToProject?: number;
}

export interface ProjectionResult {
  year: number;
  date: Date;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}