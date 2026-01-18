import React from 'react';
import { AdvisorReportData, ComparisonResult } from '../types';
import { FileText, Loader2, ShieldAlert, Sparkles, Printer, Globe } from 'lucide-react';
import { PaymentChart } from './PaymentChart';
import { AmortizationTable } from './AmortizationTable';

interface AdvisorReportProps {
  report: AdvisorReportData | null;
  loading: boolean;
  onGenerate: () => void;
  comparison: ComparisonResult;
}

export const AdvisorReport: React.FC<AdvisorReportProps> = ({ report, loading, onGenerate, comparison }) => {
  if (!report && !loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-slate-200">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">MortGauge Strategy Report</h3>
        <p className="text-slate-500 max-w-md mb-8">
          Generate a comprehensive, professional analysis of your current mortgage configuration. 
          Our AI consultant uses live market data and advanced reasoning to evaluate your strategy, opportunity costs, 
          and long-term financial impact.
        </p>
        <button
          onClick={onGenerate}
          className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all hover:shadow-md"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Professional Analysis
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-slate-200 min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Analyzing Financial Strategy...</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Please wait while our AI models complex scenarios, queries live market data, calculates compound efficiency, and prepares your executive summary.
        </p>
      </div>
    );
  }

  return (
    // Added 'printable-report' class which matches the global print CSS to show ONLY this element
    <div className="printable-report bg-white h-full overflow-y-auto custom-scrollbar rounded-lg border border-slate-200">
      <div className="max-w-4xl mx-auto p-8 md:p-12">
        
        {/* Actions - Hidden on Print */}
        <div className="mb-8 flex justify-end space-x-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Full Report
          </button>
          <button
            onClick={onGenerate}
            className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Regenerate
          </button>
        </div>

        {/* Report Container */}
        <div>
          {/* Header */}
          <div className="border-b-4 border-indigo-900 pb-6 mb-10 flex justify-between items-end">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Confidential Financial Strategy</div>
              <h1 className="text-4xl font-serif font-bold text-slate-900 leading-tight">{report?.title || "MortGauge Strategy Assessment"}</h1>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Generated On</div>
              <div className="text-lg font-medium text-slate-700 font-serif">{report?.generatedDate}</div>
            </div>
          </div>

          {/* Visualization Section */}
          <div className="mb-12 break-inside-avoid">
             <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide border-l-4 border-indigo-600 pl-4 mb-6">
                Visual Projection
             </h3>
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <PaymentChart comparison={comparison} />
             </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-10">
            {report?.sections.map((section, index) => {
              const isDisclaimer = section.heading.toLowerCase().includes('disclaimer');
              
              if (isDisclaimer) {
                return (
                  <div key={index} className="mt-16 pt-8 border-t border-slate-200 break-inside-avoid">
                    <div className="flex items-start p-6 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs leading-relaxed text-justify">
                      <ShieldAlert className="w-6 h-6 mr-4 flex-shrink-0 opacity-40 text-slate-600" />
                      <div>
                        <strong className="block text-slate-700 mb-2 text-sm uppercase tracking-wide">{section.heading}</strong>
                        {section.content}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className="prose prose-slate max-w-none break-inside-avoid">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide border-l-4 border-indigo-600 pl-4 mb-4">
                    {section.heading}
                  </h3>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line text-lg font-light bg-white">
                    {/* Simple parser to make the text look better if it has markdown-ish bolding */}
                    {section.content.split('**').map((part, i) => 
                      i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Sources / Grounding */}
          {report?.sources && report.sources.length > 0 && (
             <div className="mt-12 pt-6 border-t border-slate-200 break-inside-avoid">
                <h4 className="flex items-center text-sm font-bold text-slate-600 mb-4">
                  <Globe className="w-4 h-4 mr-2" /> Live Data Sources
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {report.sources.map((source, idx) => (
                    <div key={idx} className="text-xs text-slate-500 truncate">
                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline flex items-center">
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2 flex-shrink-0"></span>
                        {source.title || source.uri}
                      </a>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>

        {/* Appendix: Schedule (Hidden on screen, visible on print) */}
        <div className="hidden print:block print:break-before-page">
          <div className="border-b-4 border-indigo-900 pb-6 mb-10 mt-10">
            <h1 className="text-3xl font-serif font-bold text-slate-900">Appendix: Payment Schedule</h1>
            <p className="text-slate-500 mt-2">Detailed breakdown of minimum payments and accelerated principal contributions.</p>
          </div>
          <div className="bg-white">
            <AmortizationTable schedule={comparison.acceleratedSchedule} printMode={true} />
          </div>
        </div>

      </div>
    </div>
  );
};