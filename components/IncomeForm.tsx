import React, { useState, useRef } from 'react';
import { IncomeDetails } from '../types';
import { extractIncomeFromDocument } from '../services/geminiService';
import { Wallet, Upload, Sparkles, Loader2, AlertCircle, FileText, X } from 'lucide-react';

interface IncomeFormProps {
  incomeDetails: IncomeDetails;
  setIncomeDetails: React.Dispatch<React.SetStateAction<IncomeDetails>>;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({ incomeDetails, setIncomeDetails }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, field: keyof IncomeDetails) => {
    const value = (field === 'annualGrossIncome' || field === 'monthlyNetIncome' || field === 'creditScore') 
      ? parseFloat(e.target.value) || 0 
      : e.target.value;
    
    setIncomeDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload an image or PDF file.');
      return;
    }
    
    setError(null);
    setIsExtracting(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const extractedData = await extractIncomeFromDocument(base64String, file.type);
        
        setIncomeDetails(prev => ({
          ...prev,
          annualGrossIncome: extractedData.annualGrossIncome || prev.annualGrossIncome,
          monthlyNetIncome: extractedData.monthlyNetIncome || prev.monthlyNetIncome,
          creditScore: extractedData.creditScore || prev.creditScore,
          employmentStatus: extractedData.employmentStatus || prev.employmentStatus,
          additionalInfo: (prev.additionalInfo + (extractedData.additionalInfo ? `\nExtracted Note: ${extractedData.additionalInfo}` : "")).trim(),
          uploadedFileName: file.name
        }));
        
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Failed to process document.");
      setIsExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setIncomeDetails(prev => ({
      ...prev,
      uploadedFileName: null
      // We do not clear the extracted fields as the user might have edited them, 
      // but we remove the file association.
    }));
    // Reset file input so same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="h-full bg-slate-50/50 p-6 rounded-lg overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            Income & Financial Context
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Providing income details allows our AI to give personalized affordability checks and smarter strategy suggestions.
          </p>
        </div>

        {/* AI Extraction Section */}
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl transition-all duration-300">
          
          {incomeDetails.uploadedFileName ? (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700">{incomeDetails.uploadedFileName}</p>
                    <p className="text-xs text-emerald-600 flex items-center mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                    Analyzed & Populated
                    </p>
                </div>
                </div>
                <button 
                onClick={handleRemoveFile}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                title="Remove file from AI consideration"
                >
                <X className="w-5 h-5" />
                </button>
            </div>
          ) : (
             <div className="flex items-start justify-between">
                <div>
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Auto-Fill with AI
                </h3>
                <p className="text-xs text-indigo-700 mt-1 max-w-sm">
                    Upload a pay stub, tax return summary, or bank statement. Our AI will extract key figures to populate the form below.
                </p>
                </div>
                <div className="relative">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                    {isExtracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isExtracting ? "Analyzing..." : "Upload Document"}
                </button>
                </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>

        {/* Manual Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div>
               <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Annual Gross Income</label>
               <div className="relative">
                 <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                 <input
                   type="number"
                   value={incomeDetails.annualGrossIncome || ''}
                   onChange={(e) => handleChange(e, 'annualGrossIncome')}
                   placeholder="e.g. 120000"
                   className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>
             </div>
             
             <div>
               <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Monthly Net Income (Take Home)</label>
               <div className="relative">
                 <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                 <input
                   type="number"
                   value={incomeDetails.monthlyNetIncome || ''}
                   onChange={(e) => handleChange(e, 'monthlyNetIncome')}
                   placeholder="e.g. 6500"
                   className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
               </div>
             </div>

             <div>
               <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Credit Score (Optional)</label>
               <input
                 type="number"
                 value={incomeDetails.creditScore || ''}
                 onChange={(e) => handleChange(e, 'creditScore')}
                 placeholder="e.g. 760"
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Employment Status</label>
               <select
                 value={incomeDetails.employmentStatus}
                 onChange={(e) => handleChange(e, 'employmentStatus')}
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 <option value="Employed">Full-time Employed</option>
                 <option value="Self-Employed">Self-Employed</option>
                 <option value="Contractor">Contractor</option>
                 <option value="Retired">Retired</option>
                 <option value="Other">Other</option>
               </select>
             </div>
           </div>

           <div>
             <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Additional Financial Context</label>
             <textarea
               value={incomeDetails.additionalInfo}
               onChange={(e) => handleChange(e, 'additionalInfo')}
               rows={4}
               placeholder="Enter any other details: e.g., expecting a bonus in March, planning to retire in 10 years, have high student loan debt, etc."
               className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
             />
             <p className="text-xs text-slate-400 mt-1">Our AI Consultant will read this to tailor the report.</p>
           </div>
        </div>
      </div>
    </div>
  );
};