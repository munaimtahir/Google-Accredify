
import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, FileText, Clipboard, Check, RefreshCw, Calendar } from 'lucide-react';
import { Indicator, Evidence } from '../types';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


interface AIComplianceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator;
  onAddEvidence: (indicatorId: string, newEvidence: Omit<Evidence, 'id'>) => Promise<void>;
  onUpdateIndicator: (indicator: Indicator) => void;
}

const AIComplianceGuideModal: React.FC<AIComplianceGuideModalProps> = ({ isOpen, onClose, indicator, onAddEvidence, onUpdateIndicator }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [guideContent, setGuideContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      
      // Check if we already have a cached analysis
      if (indicator.aiAnalysis && indicator.aiAnalysis.content) {
        setGuideContent(indicator.aiAnalysis.content);
        setLastUpdated(indicator.aiAnalysis.timestamp);
        setIsLoading(false);
      } else {
        // No cache, generate fresh
        fetchGuide();
      }
    }
  }, [isOpen, indicator]);

  const fetchGuide = async () => {
    setIsLoading(true);
    setError('');
    try {
      const content = await api.generateComplianceGuide(indicator);
      setGuideContent(content);
      const timestamp = new Date().toISOString();
      setLastUpdated(timestamp);
      
      // Save to indicator to persist
      onUpdateIndicator({
        ...indicator,
        aiAnalysis: {
            content,
            timestamp
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(guideContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsEvidence = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('AI-Generated Compliance Document', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`For Indicator: ${indicator.indicator}`, 14, 28);
    
    // Use autoTable for a clean layout of the markdown-like text
    const splitText = doc.splitTextToSize(guideContent, 180);
    // @ts-ignore
    doc.autoTable({
        startY: 35,
        body: splitText.map((line: string) => [line]),
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 10 }
    });

    const pdfBlob = doc.output('blob');
    const fileName = `AI_Guide_${indicator.id}.pdf`;
    
    const newEvidence: Omit<Evidence, 'id'> = {
      fileName,
      fileUrl: URL.createObjectURL(pdfBlob),
      dateUploaded: new Date().toISOString().split('T')[0],
      type: 'document'
    };

    await onAddEvidence(indicator.id, newEvidence);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600"/> AI Compliance Guide
            </h2>
            <p className="text-sm text-slate-500 truncate max-w-md">{indicator.indicator}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Loader2 size={32} className="animate-spin text-indigo-600 mb-4"/>
                <p className="font-semibold">Generating guidance...</p>
                <p className="text-sm">The AI is analyzing the compliance requirements.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm mb-4">{error}</div>
                <button onClick={fetchGuide} className="text-sm text-indigo-600 hover:underline flex items-center gap-1"><RefreshCw size={14}/> Try Again</button>
            </div>
          ) : (
            <>
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                     <div className="flex items-center gap-1.5">
                         {lastUpdated && (
                             <>
                                <Calendar size={12}/>
                                <span>Generated on {new Date(lastUpdated).toLocaleString()}</span>
                             </>
                         )}
                     </div>
                     <button onClick={fetchGuide} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors">
                         <RefreshCw size={12}/> Regenerate
                     </button>
                </div>
                <div className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-headings:text-slate-800">
                    <pre className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap font-sans text-sm focus:outline-none">
                        {guideContent}
                    </pre>
                </div>
            </>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button type="button" onClick={handleCopyToClipboard} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-200 flex items-center justify-center gap-2">
                 {copied ? <Check size={16} className="text-emerald-500"/> : <Clipboard size={16} />}
                 {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button type="button" onClick={handleSaveAsEvidence} disabled={isLoading || !!error} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2">
                <FileText size={16} /> Save as Evidence
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIComplianceGuideModal;
