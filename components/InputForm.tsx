import React, { useState } from 'react';
import { LoanDetails, ExtraPayments, CustomPayment, PaymentFrequency } from '../types';
import { Calculator, Calendar, DollarSign, Percent, Plus, Trash2, Repeat, TrendingUp } from 'lucide-react';

interface InputFormProps {
  loanDetails: LoanDetails;
  setLoanDetails: React.Dispatch<React.SetStateAction<LoanDetails>>;
  extraPayments: ExtraPayments;
  setExtraPayments: React.Dispatch<React.SetStateAction<ExtraPayments>>;
}

export const InputForm: React.FC<InputFormProps> = ({
  loanDetails,
  setLoanDetails,
  extraPayments,
  setExtraPayments,
}) => {
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newPaymentType, setNewPaymentType] = useState<PaymentFrequency>('one-time');
  const [newPaymentIncrease, setNewPaymentIncrease] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof LoanDetails) => {
    const value = field === 'startDate' ? e.target.value : parseFloat(e.target.value) || 0;
    setLoanDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleMonthlyExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setExtraPayments((prev) => ({ ...prev, monthlyExtra: value }));
  };
  
  const handleMonthlyExtraIncreaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setExtraPayments((prev) => ({ ...prev, monthlyExtraIncreasePercentage: value }));
  };

  const addCustomPayment = () => {
    if (newPaymentAmount <= 0) return;
    
    const newPayment: CustomPayment = {
      id: Math.random().toString(36).substr(2, 9),
      amount: newPaymentAmount,
      date: newPaymentDate,
      type: newPaymentType,
      annualIncreasePercentage: newPaymentType === 'annual' ? newPaymentIncrease : undefined
    };

    setExtraPayments(prev => ({
      ...prev,
      customPayments: [...prev.customPayments, newPayment]
    }));

    // Reset form
    setNewPaymentAmount(0);
    setNewPaymentIncrease(0);
  };

  const removeCustomPayment = (id: string) => {
    setExtraPayments(prev => ({
      ...prev,
      customPayments: prev.customPayments.filter(p => p.id !== id)
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
        <Calculator className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-800">Loan Configuration</h2>
      </div>

      <div className="space-y-4">
        {/* Loan Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Loan Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={loanDetails.loanAmount}
              onChange={(e) => handleChange(e, 'loanAmount')}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Interest Rate (%)</label>
          <div className="relative">
            <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="number"
              step="0.1"
              value={loanDetails.interestRate}
              onChange={(e) => handleChange(e, 'interestRate')}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Loan Term */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Term (Years)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={loanDetails.loanTermYears}
              onChange={(e) => handleChange(e, 'loanTermYears')}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

         {/* Start Date */}
         <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Start Date</label>
          <input
            type="date"
            value={loanDetails.startDate}
            onChange={(e) => handleChange(e, 'startDate')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Accelerated Payments</h3>
        
        <div className="space-y-6">
          {/* Monthly Extra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-emerald-600 uppercase mb-1">Monthly Extra</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-emerald-500" />
                <input
                  type="number"
                  value={extraPayments.monthlyExtra}
                  onChange={handleMonthlyExtraChange}
                  className="w-full pl-9 pr-2 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
            <div>
               <label className="block text-xs font-medium text-emerald-600 uppercase mb-1 flex items-center whitespace-nowrap">
                  Annual Growth %
                  <TrendingUp className="w-3 h-3 ml-1" />
               </label>
               <div className="relative">
                <Percent className="absolute left-3 top-2.5 w-4 h-4 text-emerald-500" />
                <input
                  type="number"
                  placeholder="0"
                  value={extraPayments.monthlyExtraIncreasePercentage || ''}
                  onChange={handleMonthlyExtraIncreaseChange}
                  className="w-full pl-9 pr-2 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* List of Custom Payments */}
          {extraPayments.customPayments.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 uppercase">Scheduled Payments</label>
              <div className="space-y-2">
                {extraPayments.customPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">${payment.amount.toLocaleString()}</span>
                      <span className="text-slate-500 flex items-center gap-1 flex-wrap">
                        {payment.type === 'annual' && <Repeat className="w-3 h-3 text-indigo-500" />}
                        {payment.type === 'annual' ? 'Every' : 'On'} {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: payment.type === 'one-time' ? 'numeric' : undefined })}
                        
                        {payment.type === 'annual' && payment.annualIncreasePercentage && payment.annualIncreasePercentage > 0 && (
                           <span className="flex items-center text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 ml-1">
                             <TrendingUp className="w-3 h-3 mr-0.5" />
                             +{payment.annualIncreasePercentage}%/yr
                           </span>
                        )}
                      </span>
                    </div>
                    <button 
                      onClick={() => removeCustomPayment(payment.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Custom Payment */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Add Lump Sum / Recurring</label>
            <div className="space-y-2">
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newPaymentAmount || ''}
                  onChange={(e) => setNewPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="flex space-x-2">
                <select 
                  value={newPaymentType}
                  onChange={(e) => setNewPaymentType(e.target.value as PaymentFrequency)}
                  className="w-1/3 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="one-time">One-time</option>
                  <option value="annual">Annual</option>
                </select>
                <input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="w-2/3 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {newPaymentType === 'annual' && (
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    placeholder="Annual Increase % (Optional)"
                    value={newPaymentIncrease || ''}
                    onChange={(e) => setNewPaymentIncrease(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <button 
                onClick={addCustomPayment}
                className="w-full flex items-center justify-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};