import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ComparisonResult } from '../types';

interface PaymentChartProps {
  comparison: ComparisonResult;
}

export const PaymentChart: React.FC<PaymentChartProps> = ({ comparison }) => {
  // Merge data for chart
  // We need to normalize length. Standard is usually longer.
  const chartData = comparison.standardSchedule.map((stdRow, index) => {
    const accRow = comparison.acceleratedSchedule[index];
    return {
      name: stdRow.date.substring(0, 7), // YYYY-MM
      standardBalance: Math.round(stdRow.remainingBalance),
      acceleratedBalance: accRow ? Math.round(accRow.remainingBalance) : 0,
      standardInterest: Math.round(stdRow.totalInterestPaid),
      acceleratedInterest: accRow ? Math.round(accRow.totalInterestPaid) : Math.round(comparison.acceleratedTotalInterest)
    };
  }).filter((_, i) => i % 6 === 0); // Downsample for performance if needed, e.g. every 6 months

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Balance Trajectory</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorStd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            tick={{fontSize: 12, fill: '#64748b'}} 
            tickFormatter={(val) => val.split('-')[0]} 
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{fontSize: 12, fill: '#64748b'}}
            tickFormatter={(val) => `$${val / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Legend wrapperStyle={{paddingTop: '20px'}} />
          
          <Area 
            type="monotone" 
            dataKey="standardBalance" 
            name="Standard Balance"
            stroke="#94a3b8" 
            fillOpacity={1} 
            fill="url(#colorStd)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="acceleratedBalance" 
            name="Accelerated Balance"
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorAcc)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};