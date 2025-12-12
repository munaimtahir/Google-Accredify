

import React, { useState, useMemo } from 'react';
import { X, Download, Upload, MessageSquare, FileText, Link as LinkIcon, Plus, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { Indicator, Evidence } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator;
  onAddEvidence: (indicatorId: string, newEvidence: Omit<Evidence, 'id'>) => Promise<void>;
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({ isOpen, onClose, indicator, onAddEvidence }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'digital'>('upload');
  const [noteContent, setNoteContent] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasFormSchema = useMemo(() => indicator.formSchema && indicator.formSchema.length > 0, [indicator.formSchema]);

  const sortedEvidence = useMemo(() => {
    return [...indicator.evidence].sort((a, b) => new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime());
  }, [indicator.evidence]);
  
  const resetFormState = () => {
    setNoteContent('');
    setFormData({});
    setActiveTab('upload');
  };

  if (!isOpen) return null;
  
  const generatePdfLogSheet = () => {
    const doc = new jsPDF();
    // @ts-ignore
    const autoTable = doc.autoTable;

    doc.setFontSize(18);
    doc.text('Compliance Log Sheet', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    autoTable({
        startY: 30,
        head: [['Parameter', 'Details']],
        body: [
            ['Indicator:', indicator.indicator],
            ['Standard:', indicator.standard],
            ['Section:', indicator.section],
            ['Frequency:', indicator.frequency || 'N/A'],
        ],
        theme: 'grid'
    });
    
    autoTable({
        startY: (autoTable as any).last.finalY + 10,
        head: [['Date', 'Reading / Value', 'Notes / Observations', 'Signature']],
        body: Array(15).fill(['', '', '', '']),
        theme: 'striped'
    });

    doc.save(`logsheet_${indicator.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newEvidence: Omit<Evidence, 'id'> = {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // Note: This is a temporary blob URL
        dateUploaded: new Date().toISOString().split('T')[0],
        type: file.type.startsWith('image/') ? 'image' : 'document'
      };
      onAddEvidence(indicator.id, newEvidence).then(() => {
          e.target.value = ''; // Reset file input
      });
    }
  };
  
  const handleDigitalSubmit = async () => {
    setIsSubmitting(true);
    if (hasFormSchema) {
        // Generate PDF from form data
        const doc = new jsPDF();
        const body = indicator.formSchema!.map(field => [field.label, formData[field.name] || 'N/A']);
        
        doc.setFontSize(16);
        doc.text('Digital Log Entry', 14, 22);
        doc.setFontSize(11);
        doc.text(`Indicator: ${indicator.indicator}`, 14, 30);
        doc.text(`Date Logged: ${new Date().toLocaleDateString()}`, 14, 36);
        
        // @ts-ignore
        doc.autoTable({ startY: 42, head: [['Field', 'Value']], body, theme: 'grid' });

        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], `digital_log_${indicator.id}_${new Date().toISOString().split('T')[0]}.pdf`, { type: 'application/pdf' });

        const newEvidence: Omit<Evidence, 'id'> = {
            fileName: pdfFile.name,
            fileUrl: URL.createObjectURL(pdfFile),
            dateUploaded: new Date().toISOString().split('T')[0],
            type: 'document'
        };
        await onAddEvidence(indicator.id, newEvidence);
        setFormData({});

    } else if (noteContent.trim()) {
        const newEvidence: Omit<Evidence, 'id'> = {
            content: noteContent,
            dateUploaded: new Date().toISOString().split('T')[0],
            type: 'note'
        };
        await onAddEvidence(indicator.id, newEvidence);
        setNoteContent('');
    }
    setIsSubmitting(false);
    setActiveTab('upload');
  };
  
  const handleFormInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const EvidenceIcon = ({ type }: { type: Evidence['type'] }) => {
      switch (type) {
          case 'note': return <MessageSquare size={16} />; case 'link': return <LinkIcon size={16} />;
          default: return <FileText size={16} />;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Evidence Library</h2>
            <p className="text-sm text-slate-500 truncate max-w-md">{indicator.indicator}</p>
          </div>
          <button onClick={() => { onClose(); resetFormState(); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
            <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Logging Actions</h3>
                <div className="flex border-b mb-4">
                    <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'upload' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Upload Evidence</button>
                    <button onClick={() => setActiveTab('digital')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'digital' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Digital Log</button>
                    <button onClick={generatePdfLogSheet} className="ml-auto px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-2"><Download size={16}/> Printable Sheet</button>
                </div>
                
                {activeTab === 'upload' && (
                  <label className="w-full border-2 border-dashed rounded-xl p-8 text-center transition-all bg-slate-50 hover:border-indigo-400 cursor-pointer flex flex-col items-center justify-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2"><Upload size={24} /></div>
                    <p className="text-sm font-medium text-slate-600">Click to upload or drag & drop</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, etc.</p>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}

                {activeTab === 'digital' && (
                    <div className="mt-4 animate-fade-in">
                        {hasFormSchema ? (
                            <div className="space-y-4">
                                {indicator.formSchema!.map(field => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{field.label} {field.required && '*'}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea required={field.required} value={formData[field.name] || ''} onChange={e => handleFormInputChange(field.name, e.target.value)} className="w-full text-sm p-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3}/>
                                        ) : (
                                            <input type={field.type} required={field.required} value={formData[field.name] || ''} onChange={e => handleFormInputChange(field.name, e.target.value)} className="w-full text-sm p-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                           <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Enter log details, observations, or notes..." className="w-full text-sm p-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={5}/>
                        )}
                         <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setActiveTab('upload')} className="px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-200">Cancel</button>
                            <button onClick={handleDigitalSubmit} disabled={isSubmitting} className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                                {isSubmitting && <Loader2 size={16} className="animate-spin"/>}
                                Save Log
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Evidence History ({sortedEvidence.length})</h3>
                <div className="space-y-2">
                    {sortedEvidence.length > 0 ? sortedEvidence.map(ev => (
                        <div key={ev.id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded flex items-center justify-center text-slate-500 bg-slate-100 flex-shrink-0"><EvidenceIcon type={ev.type} /></div>
                                <div className="flex flex-col min-w-0">
                                    {ev.type === 'note' ? <p className="text-sm text-slate-700 italic">"{ev.content}"</p> : <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 truncate hover:text-blue-600">{ev.fileName}</a>}
                                    <span className="text-[10px] text-slate-400">{ev.dateUploaded}</span>
                                </div>
                            </div>
                            <button className="text-slate-300 hover:text-red-500 p-1.5 rounded-md opacity-50 cursor-not-allowed" title="Delete (coming soon)"><Trash2 size={16} /></button>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
                            <FileText size={24} className="mx-auto mb-2 text-slate-300"/>
                            <p className="text-sm font-medium">No evidence has been logged for this indicator.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;