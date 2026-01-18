import React, { useState } from 'react';
import { PaymentRow } from '../types';

interface AmortizationTableProps {
  schedule: PaymentRow[];
  printMode?: boolean;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, printMode = false }) => {
  // Simple pagination to prevent rendering massive DOM, unless in print mode
  const [limit, setLimit] = useState(24);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const visibleSchedule = printMode ? schedule : schedule.slice(0, limit);

  return (
    <div className="overflow-hidden flex flex-col h-full print:overflow-visible print:h-auto">
      <div className={`px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-end items-center ${printMode ? 'hidden' : ''}`}>
        <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">{schedule.length} Payments Total</span>
      </div>
      <div className="overflow-x-auto flex-1 print:overflow-visible">
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 print:static">
            <tr>
              <th className="px-6 py-3 bg-slate-50 print:px-2">Date</th>
              <th className="px-6 py-3 bg-slate-50 print:px-2">Min Payment</th>
              <th className="px-6 py-3 bg-slate-50 print:px-2">Extra</th>
              <th className="px-6 py-3 bg-slate-50 print:px-2 text-indigo-700 font-bold bg-indigo-50/50">Total Payment</th>
              <th className="px-6 py-3 bg-slate-50 print:px-2">Principal</th>
              <th className="px-6 py-3 bg-slate-50 print:px-2">Interest</th>
              <th className="px-6 py-3 bg-slate-50 print:px-2">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleSchedule.map((row) => (
              <tr key={row.month} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                <td className="px-6 py-3 text-slate-600 print:px-2 whitespace-nowrap">{row.date}</td>
                <td className="px-6 py-3 text-slate-500 print:px-2">{formatCurrency(row.minPayment)}</td>
                <td className="px-6 py-3 font-medium text-emerald-600 print:px-2">
                  {row.extraPayment > 0 ? `+${formatCurrency(row.extraPayment)}` : '-'}
                </td>
                <td className="px-6 py-3 font-bold text-indigo-700 bg-indigo-50/30 print:px-2">
                    {formatCurrency(row.payment)}
                </td>
                <td className="px-6 py-3 text-slate-600 print:px-2">{formatCurrency(row.principal)}</td>
                <td className="px-6 py-3 text-orange-600 print:px-2">{formatCurrency(row.interest)}</td>
                <td className="px-6 py-3 text-slate-600 print:px-2">{formatCurrency(row.remainingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!printMode && limit < schedule.length && (
          <div className="p-4 text-center border-t border-slate-100 bg-white sticky bottom-0">
             <button 
              onClick={() => setLimit(prev => prev + 24)}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
             >
                Show More Rows
             </button>
          </div>
        )}
      </div>
    </div>
  );
};