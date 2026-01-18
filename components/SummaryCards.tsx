import React from 'react';
import { ComparisonResult, LoanDetails, ExtraPayments } from '../types';
import { TrendingDown, CalendarCheck, PiggyBank, ArrowRight } from 'lucide-react';
import { calculateMonthlyPayment } from '../services/mortgageCalculator';

interface SummaryCardsProps {
  comparison: ComparisonResult;
  loanDetails: LoanDetails;
  extraPayments: ExtraPayments;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ comparison, loanDetails, extraPayments }) => {
  const minPayment = calculateMonthlyPayment(loanDetails.loanAmount, loanDetails.interestRate, loanDetails.loanTermYears);
  
  const currentMonthlyPayment = minPayment + (extraPayments.monthlyExtra || 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Monthly Payment */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center space-x-2 mb-2">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {extraPayments.monthlyExtra > 0 ? 'Target Payment' : 'Min. Payment'}
          </span>
        </div>
        <div className="text-2xl font-bold text-slate-800">{formatCurrency(currentMonthlyPayment)}</div>
        <div className="text-xs text-slate-400 mt-1">
          {extraPayments.monthlyExtra > 0 
            ? `Includes ${formatCurrency(extraPayments.monthlyExtra)} extra`
            : 'Required monthly'}
        </div>
      </div>

      {/* Payoff Date */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center space-x-2 mb-2">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payoff Date</span>
        </div>
        <div className="flex items-baseline space-x-2">
           <div className="text-xl font-bold text-slate-800">{new Date(comparison.acceleratedPayoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           {comparison.timeSavedMonths > 0 && (
             <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
               -{Math.floor(comparison.timeSavedMonths / 12)}y {comparison.timeSavedMonths % 12}m
             </div>
           )}
        </div>
        <div className="text-xs text-slate-400 mt-1">Original: {new Date(comparison.standardPayoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
      </div>

      {/* Interest Saved */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center space-x-2 mb-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <PiggyBank className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interest Saved</span>
        </div>
        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(comparison.interestSaved)}</div>
        <div className="text-xs text-slate-400 mt-1">Total Savings</div>
      </div>

      {/* Total Interest Paid */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center space-x-2 mb-2">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
            <ArrowRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Interest</span>
        </div>
        <div className="text-2xl font-bold text-slate-800">{formatCurrency(comparison.acceleratedTotalInterest)}</div>
        <div className="text-xs text-slate-400 mt-1">Original: {formatCurrency(comparison.standardTotalInterest)}</div>
      </div>
    </div>
  );
};