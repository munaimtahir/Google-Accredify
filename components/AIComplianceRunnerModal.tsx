
import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { Indicator, Evidence, ComplianceStatus } from '../types';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface AIComplianceRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  onAddEvidence: (indicatorId: string, newEvidence: Omit<Evidence, 'id'>) => Promise<void>;
  onUpdateIndicator: (indicator: Indicator) => void;
}

type Suggestion = {
  indicatorId: string;
  suggestion: string;
  isActionableByAI: boolean;
};

type SuggestionState = 'idle' | 'loading' | 'success';

const AIComplianceRunnerModal: React.FC<AIComplianceRunnerModalProps> = ({ isOpen, onClose, indicators, onAddEvidence, onUpdateIndicator }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState('');
  const [suggestionStates, setSuggestionStates] = useState<Record<string, SuggestionState>>({});

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError('');
      setSuggestions([]);
      setSuggestionStates({});
      
      const runAnalysis = async () => {
        try {
          const results = await api.analyzeChecklistForActionableTasks(indicators);
          setSuggestions(results);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
          setIsLoading(false);
        }
      };
      
      runAnalysis();
    }
  }, [isOpen, indicators]);

  if (!isOpen) return null;

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    setSuggestionStates(prev => ({ ...prev, [suggestion.indicatorId]: 'loading' }));
    
    try {
        const indicator = indicators.find(i => i.id === suggestion.indicatorId);
        if (!indicator) throw new Error("Indicator not found.");

        const guideContent = await api.generateComplianceGuide(indicator);
        const timestamp = new Date().toISOString();

        // 1. Save the text content to the indicator for future reference (Analysis Log)
        const updatedIndicator = {
            ...indicator,
            aiAnalysis: {
                content: guideContent,
                timestamp: timestamp
            }
        };
        onUpdateIndicator(updatedIndicator);

        // 2. Generate PDF from the guide content as formal evidence
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('AI-Generated Compliance Document', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`For Indicator: ${indicator.indicator}`, 14, 28);
        
        const splitText = doc.splitTextToSize(guideContent, 180);
        // @ts-ignore
        doc.autoTable({
            startY: 35,
            body: splitText.map((line: string) => [line]),
            theme: 'plain',
            styles: { font: 'helvetica', fontSize: 10 }
        });

        const pdfBlob = doc.output('blob');
        const fileName = `AI_DRAFT_${indicator.indicator.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.pdf`;
        
        const newEvidence: Omit<Evidence, 'id'> = {
            fileName,
            fileUrl: URL.createObjectURL(pdfBlob), // Temporary URL for display
            dateUploaded: timestamp.split('T')[0],
            type: 'document'
        };

        await onAddEvidence(indicator.id, newEvidence);
        setSuggestionStates(prev => ({ ...prev, [suggestion.indicatorId]: 'success' }));

    } catch (err) {
        console.error("Failed to apply suggestion:", err);
        setSuggestionStates(prev => ({ ...prev, [suggestion.indicatorId]: 'idle' }));
    }
  };
  
  const getIndicatorById = (id: string) => indicators.find(i => i.id === id);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-8">
          <Loader2 size={32} className="animate-spin text-indigo-600 mb-4"/>
          <p className="font-semibold text-lg">AI is analyzing your checklist...</p>
          <p className="text-sm mt-1">This may take a moment. We're scanning for compliance gaps and identifying actionable solutions.</p>
        </div>
      );
    }

    if (error) {
      return <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm m-6">{error}</div>;
    }
    
    if (suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-emerald-700 text-center p-8">
                <CheckCircle size={40} className="text-emerald-500 mb-4"/>
                <p className="font-semibold text-lg">Excellent Compliance Status!</p>
                <p className="text-sm mt-1">The AI scanner found no immediate "Not Started" or "Non-Compliant" items that require action.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-6">
            {suggestions.map(s => {
                const indicator = getIndicatorById(s.indicatorId);
                const state = suggestionStates[s.indicatorId] || 'idle';
                if (!indicator) return null;
                return (
                    <div key={s.indicatorId} className="bg-slate-50 border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`p-1.5 rounded-full ${indicator.status === ComplianceStatus.NON_COMPLIANT ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                <p className="font-bold text-slate-800">{indicator.indicator}</p>
                            </div>
                            <p className="text-sm text-slate-600 ml-5">{s.suggestion}</p>
                        </div>
                        <div className="md:w-56 text-right flex-shrink-0">
                            {s.isActionableByAI ? (
                                <button 
                                    onClick={() => handleApplySuggestion(s)} 
                                    disabled={state !== 'idle'}
                                    className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300
                                        ${state === 'idle' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : ''}
                                        ${state === 'loading' ? 'bg-slate-200 text-slate-600 cursor-wait' : ''}
                                        ${state === 'success' ? 'bg-emerald-500 text-white cursor-default' : ''}
                                    `}
                                >
                                    {state === 'idle' && <><Sparkles size={16}/> Generate with AI</>}
                                    {state === 'loading' && <><Loader2 size={16} className="animate-spin"/> Generating...</>}
                                    {state === 'success' && <><CheckCircle size={16}/> Draft Saved</>}
                                </button>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-200 rounded-full">
                                    <FileText size={14}/> Manual Action
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600"/> AI Compliance Scanner Results
            </h2>
            <p className="text-sm text-slate-500">Review the suggestions below to improve your compliance score.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                Close Scanner
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIComplianceRunnerModal;
