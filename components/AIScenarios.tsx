import React, { useState } from 'react';
import { LoanDetails, AIScenario, ExtraPayments, CustomPayment, IncomeDetails } from '../types';
import { generateScenarios } from '../services/geminiService';
import { Sparkles, RefreshCcw, Bookmark, PlayCircle, Loader2 } from 'lucide-react';

interface AIScenariosProps {
  loanDetails: LoanDetails;
  setExtraPayments: React.Dispatch<React.SetStateAction<ExtraPayments>>;
  pinnedScenarios: AIScenario[];
  setPinnedScenarios: React.Dispatch<React.SetStateAction<AIScenario[]>>;
  incomeDetails: IncomeDetails;
}

interface ScenarioCardProps {
  scenario: AIScenario;
  isPinned: boolean;
  onPin: (scenario: AIScenario) => void;
  onApply: (scenario: AIScenario) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, isPinned, onPin, onApply }) => (
  <div className={`p-4 rounded-xl border transition-all duration-200 ${isPinned ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-slate-800">{scenario.title}</h4>
      <div className="flex space-x-1">
        <button 
          onClick={() => onPin(scenario)}
          className={`p-1 rounded-full ${isPinned ? 'text-amber-500 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200'}`}
        >
          <Bookmark className="w-4 h-4" fill={isPinned ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
    <p className="text-sm text-slate-600 mb-3">{scenario.description}</p>
    
    <div className="bg-white/50 p-2 rounded mb-3 text-xs text-slate-500">
      <strong>Reasoning:</strong> {scenario.reasoning}
    </div>

    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50">
      <div className="text-xs font-mono text-indigo-600">
        {scenario.suggestedExtraMonthly > 0 && `+$${scenario.suggestedExtraMonthly}/mo `}
        {scenario.suggestedOneTime && scenario.suggestedOneTime > 0 && ` +$${scenario.suggestedOneTime} One-time`}
      </div>
      <button 
        onClick={() => onApply(scenario)}
        className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800"
      >
        APPLY <PlayCircle className="w-3 h-3 ml-1" />
      </button>
    </div>
  </div>
);

export const AIScenarios: React.FC<AIScenariosProps> = ({
  loanDetails,
  setExtraPayments,
  pinnedScenarios,
  setPinnedScenarios,
  incomeDetails
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedScenarios, setGeneratedScenarios] = useState<AIScenario[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    const results = await generateScenarios(loanDetails, incomeDetails);
    setGeneratedScenarios(results);
    setLoading(false);
  };

  const applyScenario = (scenario: AIScenario) => {
    setExtraPayments(prev => {
      const newCustomPayments: CustomPayment[] = [...prev.customPayments];
      
      // If AI suggests a lump sum, add it as a new custom payment
      if (scenario.suggestedOneTime && scenario.suggestedOneTime > 0) {
        newCustomPayments.push({
          id: Math.random().toString(36).substr(2, 9),
          amount: scenario.suggestedOneTime,
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next month
          type: 'one-time'
        });
      }

      return {
        ...prev,
        monthlyExtra: scenario.suggestedExtraMonthly || 0,
        customPayments: newCustomPayments
      };
    });
  };

  const togglePin = (scenario: AIScenario) => {
    if (pinnedScenarios.find(s => s.id === scenario.id)) {
      setPinnedScenarios(prev => prev.filter(s => s.id !== scenario.id));
    } else {
      setPinnedScenarios(prev => [...prev, scenario]);
    }
  };

  return (
    <div className="h-full">
      <div className="flex justify-end items-center mb-6">
        {/* Title removed, managed by Tab */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
          {generatedScenarios.length > 0 ? "Refresh Suggestions" : "Generate Suggestions"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {pinnedScenarios.map((scenario, idx) => (
          <ScenarioCard 
            key={`pin-${idx}`} 
            scenario={scenario} 
            isPinned={true} 
            onPin={togglePin} 
            onApply={applyScenario}
          />
        ))}

        {generatedScenarios
          .filter(g => !pinnedScenarios.find(p => p.id === g.id))
          .map((scenario, idx) => (
            <ScenarioCard 
              key={idx} 
              scenario={scenario} 
              isPinned={false} 
              onPin={togglePin} 
              onApply={applyScenario}
            />
        ))}
        
        {generatedScenarios.length === 0 && pinnedScenarios.length === 0 && !loading && (
          <div className="col-span-full text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Click "Generate" to get custom AI payoff strategies based on your loan.</p>
          </div>
        )}
      </div>
    </div>
  );
};