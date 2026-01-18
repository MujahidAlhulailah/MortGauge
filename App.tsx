import React, { useState, useMemo } from 'react';
import { LoanDetails, ExtraPayments, AIScenario, IncomeDetails, AdvisorReportData } from './types';
import { calculateMortgage } from './services/mortgageCalculator';
import { generateAdvisorReport } from './services/geminiService';
import { InputForm } from './components/InputForm';
import { SummaryCards } from './components/SummaryCards';
import { PaymentChart } from './components/PaymentChart';
import { AIScenarios } from './components/AIScenarios';
import { AmortizationTable } from './components/AmortizationTable';
import { AdvisorReport } from './components/AdvisorReport';
import { IncomeForm } from './components/IncomeForm';
import { Landmark, Sparkles, Table, FileText, Wallet, Gauge } from 'lucide-react';

const App: React.FC = () => {
  // Default State set to match the attached lender document (Breckenridge property)
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loanAmount: 636000,
    interestRate: 6.125,
    loanTermYears: 30,
    startDate: '2026-03-01',
  });

  const [extraPayments, setExtraPayments] = useState<ExtraPayments>({
    monthlyExtra: 0,
    customPayments: []
  });

  const [incomeDetails, setIncomeDetails] = useState<IncomeDetails>({
    annualGrossIncome: 0,
    monthlyNetIncome: 0,
    creditScore: 0,
    employmentStatus: 'Employed',
    additionalInfo: '',
    uploadedFileName: null
  });

  // State for AI Report (Lifted to App to persist across tabs)
  const [advisorReport, setAdvisorReport] = useState<AdvisorReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [pinnedScenarios, setPinnedScenarios] = useState<AIScenario[]>([]);
  const [activeTab, setActiveTab] = useState<'ai' | 'schedule' | 'report' | 'income'>('ai');

  // Memoize heavy calculations so they only run when inputs change
  const comparison = useMemo(() => {
    return calculateMortgage(loanDetails, extraPayments);
  }, [loanDetails, extraPayments]);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    // Don't switch tabs immediately, let user watch spinner if they stay or do other things
    const result = await generateAdvisorReport(loanDetails, extraPayments, comparison, incomeDetails);
    if (result) {
      result.generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      setAdvisorReport(result);
    }
    setIsGeneratingReport(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center space-x-3 mb-8">
          <div className="bg-indigo-600 p-2.5 rounded-lg shadow-lg shadow-indigo-200">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MortGauge</h1>
            <p className="text-sm text-slate-500">Gauge your mortgage potential with AI foresight.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-3 space-y-6">
            <InputForm 
              loanDetails={loanDetails} 
              setLoanDetails={setLoanDetails}
              extraPayments={extraPayments}
              setExtraPayments={setExtraPayments}
            />
          </div>

          {/* Right Column: Visualization & Data */}
          <div className="lg:col-span-9 space-y-6">
            
            <div>
              <SummaryCards comparison={comparison} loanDetails={loanDetails} extraPayments={extraPayments} />
              <PaymentChart comparison={comparison} />
            </div>

            {/* Tabbed Interface for Strategies, Schedule & Report */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
              <div className="flex border-b border-slate-100 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex items-center justify-center space-x-2 flex-1 min-w-[120px] py-4 text-sm font-medium transition duration-200 ${
                    activeTab === 'ai' 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Strategies</span>
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex items-center justify-center space-x-2 flex-1 min-w-[120px] py-4 text-sm font-medium transition duration-200 ${
                    activeTab === 'schedule' 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Schedule</span>
                </button>
                <button
                  onClick={() => setActiveTab('income')}
                  className={`flex items-center justify-center space-x-2 flex-1 min-w-[120px] py-4 text-sm font-medium transition duration-200 ${
                    activeTab === 'income' 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Income Details</span>
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center justify-center space-x-2 flex-1 min-w-[120px] py-4 text-sm font-medium transition duration-200 ${
                    activeTab === 'report' 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Advisor Report</span>
                </button>
              </div>
              
              <div className="flex-1 p-6 bg-slate-50/30">
                {activeTab === 'ai' && (
                  <AIScenarios 
                    loanDetails={loanDetails}
                    setExtraPayments={setExtraPayments}
                    pinnedScenarios={pinnedScenarios}
                    setPinnedScenarios={setPinnedScenarios}
                    incomeDetails={incomeDetails}
                  />
                )}
                {activeTab === 'schedule' && (
                  <div className="h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
                     <AmortizationTable schedule={comparison.acceleratedSchedule} />
                  </div>
                )}
                {activeTab === 'income' && (
                  <IncomeForm 
                    incomeDetails={incomeDetails}
                    setIncomeDetails={setIncomeDetails}
                  />
                )}
                {activeTab === 'report' && (
                  <AdvisorReport 
                    report={advisorReport}
                    loading={isGeneratingReport}
                    onGenerate={handleGenerateReport}
                    comparison={comparison}
                  />
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default App;