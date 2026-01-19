import React, { useState, useMemo, useEffect } from 'react';
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
import { Landmark, Sparkles, Table, FileText, Wallet, Gauge, RotateCcw, Save } from 'lucide-react';

const STORAGE_KEYS = {
  LOAN: 'mortgauge_loan',
  EXTRA: 'mortgauge_extra',
  INCOME: 'mortgauge_income',
  REPORT: 'mortgauge_report',
  PINNED: 'mortgauge_pinned'
};

const loadState = <T,>(key: string, defaultVal: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed to load state for ${key}`, e);
  }
  return defaultVal;
};

const App: React.FC = () => {
  // Default State set to match the attached lender document (Breckenridge property)
  const defaultLoanDetails: LoanDetails = {
    loanAmount: 636000,
    interestRate: 6.125,
    loanTermYears: 30,
    startDate: '2026-03-01',
  };

  const [loanDetails, setLoanDetails] = useState<LoanDetails>(() => 
    loadState(STORAGE_KEYS.LOAN, defaultLoanDetails)
  );

  const [extraPayments, setExtraPayments] = useState<ExtraPayments>(() => 
    loadState(STORAGE_KEYS.EXTRA, { monthlyExtra: 0, customPayments: [] })
  );

  const [incomeDetails, setIncomeDetails] = useState<IncomeDetails>(() => 
    loadState(STORAGE_KEYS.INCOME, {
      annualGrossIncome: 0,
      monthlyNetIncome: 0,
      creditScore: 0,
      employmentStatus: 'Employed',
      additionalInfo: '',
      documents: [],
      analysisNotes: ''
    })
  );

  // State for AI Report (Lifted to App to persist across tabs)
  const [advisorReport, setAdvisorReport] = useState<AdvisorReportData | null>(() => 
    loadState(STORAGE_KEYS.REPORT, null)
  );
  
  const [pinnedScenarios, setPinnedScenarios] = useState<AIScenario[]>(() => 
    loadState(STORAGE_KEYS.PINNED, [])
  );
  
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'schedule' | 'report' | 'income'>('ai');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOAN, JSON.stringify(loanDetails));
    setSaveStatus('saved');
  }, [loanDetails]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXTRA, JSON.stringify(extraPayments));
    setSaveStatus('saved');
  }, [extraPayments]);

  useEffect(() => {
    // Strip base64 data to avoid quota limits, but keep the list visible
    const safeIncome = {
      ...incomeDetails,
      documents: incomeDetails.documents.map(d => ({ ...d, data: '' })) 
    };
    localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(safeIncome));
    setSaveStatus('saved');
  }, [incomeDetails]);

  useEffect(() => {
    if (advisorReport) {
      localStorage.setItem(STORAGE_KEYS.REPORT, JSON.stringify(advisorReport));
      setSaveStatus('saved');
    }
  }, [advisorReport]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(pinnedScenarios));
    setSaveStatus('saved');
  }, [pinnedScenarios]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data? This will clear your saved progress.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

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
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-lg shadow-lg shadow-indigo-200">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MortGauge</h1>
              <div className="flex items-center gap-2">
                 <p className="text-sm text-slate-500">Gauge your mortgage potential with AI foresight.</p>
                 <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full flex items-center">
                    {saveStatus === 'saved' ? 'Auto-saved' : 'Saving...'}
                 </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleReset}
            className="flex items-center text-xs font-medium text-slate-400 hover:text-red-500 transition px-3 py-2 rounded-lg hover:bg-red-50"
            title="Clear all saved data"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset Progress
          </button>
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