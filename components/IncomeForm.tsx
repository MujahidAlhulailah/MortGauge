import React, { useState, useRef } from 'react';
import { IncomeDetails, UploadedDocument } from '../types';
import { extractIncomeFromDocument } from '../services/geminiService';
import { Wallet, Upload, Sparkles, Loader2, AlertCircle, FileText, X, AlertTriangle } from 'lucide-react';

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

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    setError(null);
    setIsExtracting(true);

    const newDocs: UploadedDocument[] = [];
    const readers: Promise<void>[] = [];

    // Read all files
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        // Skip invalid types, maybe warn
        return;
      }
      
      const p = new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          newDocs.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            mimeType: file.type,
            data: base64String
          });
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      readers.push(p);
    });

    try {
      await Promise.all(readers);
      
      // Merge with existing docs (or replace? user might want to add more. Let's append)
      const allDocs = [...incomeDetails.documents, ...newDocs];
      
      // Update state with new docs immediately so user sees them
      setIncomeDetails(prev => ({ ...prev, documents: allDocs }));
      
      // Now Analyze ALL documents together to get consolidated info
      const extractedData = await extractIncomeFromDocument(allDocs);
      
      setIncomeDetails(prev => ({
        ...prev,
        // Update fields if they were found, otherwise keep existing
        annualGrossIncome: extractedData.annualGrossIncome || prev.annualGrossIncome,
        monthlyNetIncome: extractedData.monthlyNetIncome || prev.monthlyNetIncome,
        creditScore: extractedData.creditScore || prev.creditScore,
        employmentStatus: extractedData.employmentStatus || prev.employmentStatus,
        additionalInfo: (prev.additionalInfo + (extractedData.additionalInfo ? `\nExtracted Note: ${extractedData.additionalInfo}` : "")).trim(),
        analysisNotes: extractedData.analysisNotes // Capture conflict notes
      }));
      
    } catch (err) {
      console.error(err);
      setError("Failed to process documents.");
    } finally {
      setIsExtracting(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setIncomeDetails(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id),
      // We don't clear the extracted data automatically because the user might have manually edited it,
      // and removing a file doesn't necessarily mean the data derived from it is wrong now.
      // But we could clear the analysisNotes if we wanted.
    }));
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
          
          <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Auto-Fill with AI
                </h3>
                <p className="text-xs text-indigo-700 mt-1 max-w-sm">
                    Upload multiple pay stubs, tax summaries, or statements. We'll consolidate the data and prioritize recent info.
                </p>
              </div>
              <div className="relative">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                    {isExtracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isExtracting ? "Analyzing..." : "Upload Documents"}
                </button>
              </div>
          </div>

          {/* List of uploaded files */}
          {incomeDetails.documents.length > 0 && (
             <div className="space-y-2 mb-4">
                {incomeDetails.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="bg-indigo-100 p-1.5 rounded-lg flex-shrink-0">
                          <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile(doc.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition ml-2"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
             </div>
          )}
          
          {/* Analysis Notes / Conflicts */}
          {incomeDetails.analysisNotes && (
             <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                   <h4 className="text-xs font-bold text-amber-800 uppercase mb-1">AI Analysis Report</h4>
                   <p className="text-xs text-amber-700 leading-relaxed">{incomeDetails.analysisNotes}</p>
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