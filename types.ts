export interface LoanDetails {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  startDate: string; // ISO date string YYYY-MM-DD
}

export type PaymentFrequency = 'one-time' | 'annual';

export interface CustomPayment {
  id: string;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD. For annual, repeats on this month/day.
  type: PaymentFrequency;
  annualIncreasePercentage?: number; // Optional annual percentage increase for 'annual' payments
}

export interface ExtraPayments {
  monthlyExtra: number;
  monthlyExtraIncreasePercentage?: number;
  customPayments: CustomPayment[];
}

export interface PaymentRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  totalInterestPaid: number;
  isExtraPayment?: boolean;
  minPayment: number;
  extraPayment: number;
}

export interface ComparisonResult {
  standardSchedule: PaymentRow[];
  acceleratedSchedule: PaymentRow[];
  standardTotalInterest: number;
  acceleratedTotalInterest: number;
  standardPayoffDate: string;
  acceleratedPayoffDate: string;
  interestSaved: number;
  timeSavedMonths: number;
}

export interface AIScenario {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  suggestedExtraMonthly: number;
  suggestedOneTime?: number;
}

export interface AdvisorReportSection {
  heading: string;
  content: string;
}

export interface AdvisorReportData {
  title: string;
  sections: AdvisorReportSection[];
  generatedDate: string;
}

export interface IncomeDetails {
  annualGrossIncome: number;
  monthlyNetIncome: number;
  creditScore: number;
  employmentStatus: string;
  additionalInfo: string;
}