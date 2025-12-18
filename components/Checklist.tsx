
import React, { useState, useMemo } from 'react';
import { Indicator, ComplianceStatus, Evidence, Frequency } from '../types';
import { SECTION_COLORS } from '../constants';
import { 
  ChevronDown, ChevronUp, FileText, Upload, Check, AlertTriangle, Clock,
  Trash2, Filter, Link as LinkIcon, MessageSquare, X, ChevronsRight, CircleSlash, Plus, ClipboardEdit, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';

interface ChecklistProps {
  indicators: Indicator[];
  onUpdateIndicator: (updated: Indicator) => void;
  onOpenManageModal: () => void;
  onOpenManageFormModal: (indicator: Indicator) => void;
  onOpenAIComplianceGuideModal: (indicator: Indicator) => void;
}

const EvidenceIcon = ({ type }: { type: Evidence['type'] }) => {
    switch (type) {
        case 'note': return <MessageSquare size={16} />; case 'link': return <LinkIcon size={16} />;
        default: return <FileText size={16} />;
    }
};

const Checklist: React.FC<ChecklistProps> = ({ indicators, onUpdateIndicator, onOpenManageModal, onOpenManageFormModal, onOpenAIComplianceGuideModal }) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedInds, setSelectedInds] = useState<string[]>([]);
  
  const [evidenceForm, setEvidenceForm] = useState<{indId: string; type: 'note' | 'link'} | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const groupedIndicators = useMemo(() => {
    const sections = new Map<string, Map<string, Indicator[]>>();
    const indicatorsToFilter = selectedSection === 'All' 
      ? indicators 
      : indicators.filter(ind => ind.section === selectedSection);
      
    for (const indicator of indicatorsToFilter) {
      if (!sections.has(indicator.section)) {
        sections.set(indicator.section, new Map<string, Indicator[]>());
      }
      const standards = sections.get(indicator.section)!;
      if (!standards.has(indicator.standard)) {
        standards.set(indicator.standard, []);
      }
      standards.get(indicator.standard)!.push(indicator);
    }
    return sections;
  }, [indicators, selectedSection]);

  const uniqueSections = useMemo(() => ['All', ...new Set(indicators.map(r => r.section))], [indicators]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setEvidenceForm(null);
  };

  const handleFieldChange = (ind: Indicator, field: keyof Indicator, value: any) => {
    onUpdateIndicator({ ...ind, [field]: value });
  };

  const handleFileUpload = (ind: Indicator, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newEvidence: Evidence = {
        id: Math.random().toString(36).substring(7),
        fileName: file.name, fileUrl: URL.createObjectURL(file),
        dateUploaded: new Date().toISOString().split('T')[0],
        type: file.type.includes('image') ? 'image' : 'document'
      };
      onUpdateIndicator({ ...ind, evidence: [...ind.evidence, newEvidence] });
    }
  };

  const removeEvidence = (ind: Indicator, evidenceId: string) => {
    onUpdateIndicator({ ...ind, evidence: ind.evidence.filter(e => e.id !== evidenceId) });
  };
  
  const handleBulkStatusChange = (newStatus: ComplianceStatus) => {
    selectedInds.forEach(id => {
      const indToUpdate = indicators.find(i => i.id === id);
      if (indToUpdate) {
        onUpdateIndicator({ ...indToUpdate, status: newStatus });
      }
    });
    setSelectedInds([]);
  };

  // Logic to determine if an indicator is stale/expired based on frequency
  const getDerivedStatus = (ind: Indicator): { status: string, isExpired: boolean, isActionable: boolean } => {
    if (ind.status === ComplianceStatus.NOT_APPLICABLE) return { status: ComplianceStatus.NOT_APPLICABLE, isExpired: false, isActionable: false };
    
    // Calculate if it's expired
    if (ind.frequency && ind.frequency !== Frequency.ONE_TIME) {
       const today = new Date();
       const lastUpdated = ind.lastUpdated ? new Date(ind.lastUpdated) : null;
       
       if (!lastUpdated) {
           // Never updated, so it is action required unless marked otherwise
           return { status: ind.status === ComplianceStatus.COMPLIANT ? "Data Missing" : ind.status, isExpired: true, isActionable: true };
       }

       let expirationDate = new Date(lastUpdated);
       switch (ind.frequency) {
           case Frequency.DAILY: expirationDate.setDate(expirationDate.getDate() + 1); break;
           case Frequency.WEEKLY: expirationDate.setDate(expirationDate.getDate() + 7); break;
           case Frequency.MONTHLY: expirationDate.setMonth(expirationDate.getMonth() + 1); break;
           case Frequency.QUARTERLY: expirationDate.setMonth(expirationDate.getMonth() + 3); break;
           case Frequency.ANNUALLY: expirationDate.setFullYear(expirationDate.getFullYear() + 1); break;
       }
       
       // Reset time for accurate date comparison
       expirationDate.setHours(0,0,0,0);
       today.setHours(0,0,0,0);

       if (today >= expirationDate) {
           return { status: "Action Required", isExpired: true, isActionable: true };
       }
    }
    
    return { status: ind.status, isExpired: false, isActionable: ind.status !== ComplianceStatus.COMPLIANT };
  };

  // Check if evidence was uploaded in the current period
  const hasRecentEvidence = (ind: Indicator): boolean => {
      if (!ind.evidence.length) return false;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      // Get most recent evidence
      const sortedEv = [...ind.evidence].sort((a,b) => new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime());
      const lastEvDate = new Date(sortedEv[0].dateUploaded);
      lastEvDate.setHours(0,0,0,0);

      // Simple check: Is the evidence from today (for daily) or reasonably recent?
      if (ind.frequency === Frequency.DAILY) {
          return lastEvDate.getTime() === today.getTime();
      }
      return true;
  };

  const markAsCompliant = (ind: Indicator) => {
      onUpdateIndicator({
          ...ind,
          status: ComplianceStatus.COMPLIANT,
          lastUpdated: new Date().toISOString()
      });
  };

  const getStatusIcon = (derived: { status: string, isExpired: boolean }) => {
    if (derived.isExpired) return <AlertCircle size={18} className="text-amber-600" />;
    
    switch (derived.status) {
      case ComplianceStatus.COMPLIANT: return <Check size={18} className="text-emerald-500" />;
      case ComplianceStatus.NON_COMPLIANT: return <AlertTriangle size={18} className="text-red-500" />;
      case ComplianceStatus.IN_PROGRESS: return <Clock size={18} className="text-blue-500" />;
      case ComplianceStatus.NOT_APPLICABLE: return <CircleSlash size={18} className="text-slate-400" />;
      default: return <Clock size={18} className="text-amber-500" />;
    }
  };

  const getStatusColor = (derived: { status: string, isExpired: boolean }) => {
    if (derived.isExpired) return 'bg-amber-50 text-amber-700 border-amber-200';

    switch (derived.status) {
      case ComplianceStatus.COMPLIANT: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case ComplianceStatus.NON_COMPLIANT: return 'bg-red-50 text-red-700 border-red-200';
      case ComplianceStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-700 border-blue-200';
      case ComplianceStatus.NOT_APPLICABLE: return 'bg-slate-50 text-slate-500 border-slate-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const calculateStandardProgress = (standardIndicators: Indicator[]) => {
    const applicable = standardIndicators.filter(i => i.status !== ComplianceStatus.NOT_APPLICABLE);
    if (applicable.length === 0) return { score: 0, percentage: 0 };
    
    const totalScore = applicable.reduce((sum, i) => sum + i.score, 0);
    // Use raw status for calculation, not derived, because derived is about "Action Required" visual
    const achievedScore = applicable.filter(i => i.status === ComplianceStatus.COMPLIANT).reduce((sum, i) => sum + i.score, 0);
    
    return {
        score: achievedScore,
        percentage: totalScore > 0 ? Math.round((achievedScore / totalScore) * 100) : 0,
    };
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" /><span className="text-sm font-medium text-slate-500">Filter Section:</span>
            </div>
            <button onClick={onOpenManageModal} className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors">
                <Plus size={16} /> Manage Indicators
            </button>
        </div>
      </div>
      <div className="flex overflow-x-auto pb-4 gap-2 hide-scrollbar">
        {uniqueSections.map(section => (
          <button
            key={section}
            onClick={() => { setSelectedSection(section); setSelectedInds([]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${selectedSection === section ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {section !== 'All' && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTION_COLORS[section] || '#64748b' }}></span>}
            {section}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {Array.from(groupedIndicators.entries()).map(([section, standards]) => (
          <div key={section}>
            <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2" style={{borderColor: SECTION_COLORS[section] || '#64748b'}}>{section}</h2>
            <div className="space-y-4">
              {Array.from(standards.entries()).map(([standard, standardIndicators]) => {
                const { percentage } = calculateStandardProgress(standardIndicators);
                return (
                <div key={standard} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-2">{standard}</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex-1"><div className="bg-indigo-500 h-full" style={{ width: `${percentage}%` }}></div></div>
                            <span className="text-sm font-bold text-indigo-600 w-12 text-right">{percentage}%</span>
                        </div>
                    </div>
                    <div>
                    {standardIndicators.map(ind => {
                      const derived = getDerivedStatus(ind);
                      const canMarkCompliant = hasRecentEvidence(ind);

                      return (
                      <div key={ind.id} className={`border-t border-slate-100 transition-all duration-200 relative ${expandedId === ind.id ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'} ${selectedInds.includes(ind.id) ? 'bg-indigo-50' : ''}`}>
                        <div className="p-4 flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1" checked={selectedInds.includes(ind.id)} onChange={() => setSelectedInds(p => p.includes(ind.id) ? p.filter(id => id !== ind.id) : [...p, ind.id])} />
                            <div className="flex items-center gap-4 flex-1 cursor-pointer min-w-0" onClick={() => toggleExpand(ind.id)}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(derived)} bg-opacity-50`}>{getStatusIcon(derived)}</div>
                              <div className="min-w-0">
                                  <h4 className="font-semibold text-slate-800 text-sm md:text-base truncate">{ind.indicator}</h4>
                                  {derived.isExpired && <span className="text-xs text-amber-600 font-medium">Compliance Expired / Update Required</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 pl-2">
                             {derived.isActionable && (
                                 <button 
                                    onClick={() => markAsCompliant(ind)}
                                    disabled={!canMarkCompliant}
                                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                        ${canMarkCompliant 
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    title={canMarkCompliant ? "Mark as Compliant" : "Log evidence to enable"}
                                 >
                                    <Check size={12}/> {derived.status === ComplianceStatus.COMPLIANT ? 'Renew' : 'Mark Compliant'}
                                 </button>
                             )}
                             <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${getStatusColor(derived)}`} onClick={() => toggleExpand(ind.id)}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{derived.status}
                             </div>
                            <button onClick={() => toggleExpand(ind.id)} className="cursor-pointer">{expandedId === ind.id ? <ChevronUp size={20} className="text-indigo-400" /> : <ChevronDown size={20} className="text-slate-300" />}</button>
                          </div>
                        </div>

                        {expandedId === ind.id && (
                          <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/30 rounded-b-xl animate-fade-in">
                            <div className="pt-4 grid md:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Evidence Required</label><p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border">{ind.description}</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Status (Manual)</label><div className="relative"><select value={ind.status} onChange={(e) => handleFieldChange(ind, 'status', e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 appearance-none">{Object.values(ComplianceStatus).map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/></div></div>
                                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Frequency</label><div className="relative"><select value={ind.frequency || Frequency.ONE_TIME} onChange={(e) => handleFieldChange(ind, 'frequency', e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 appearance-none">{Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}</select><ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/></div></div>
                                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Assigned To</label><input type="text" placeholder="Unassigned" value={ind.assignee || ''} onChange={(e) => handleFieldChange(ind, 'assignee', e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500"/></div>
                                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Score</label><input type="number" value={ind.score} onChange={(e) => handleFieldChange(ind, 'score', parseInt(e.target.value, 10))} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500"/></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onOpenManageFormModal(ind)} className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-lg transition-colors border border-slate-200">
                                        <ClipboardEdit size={16} /> Manage Form
                                    </button>
                                     <button onClick={() => onOpenAIComplianceGuideModal(ind)} className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2.5 rounded-lg transition-colors border border-indigo-200">
                                        <Sparkles size={16} /> AI Guide
                                    </button>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 flex justify-between items-center"><span>Evidence Uploads</span><span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">{ind.evidence.length} items</span></label>
                                <div className="bg-slate-100/50 rounded-xl border border-dashed p-4 min-h-[140px] flex flex-col gap-3">
                                    {ind.evidence.length === 0 && !evidenceForm && (<div className="h-full flex-1 flex flex-col items-center justify-center text-slate-400 py-4"><FileText size={20} className="text-slate-300 mb-2"/><span className="text-xs font-medium">No documents uploaded yet.</span></div>)}
                                    <div className="space-y-2">{ind.evidence.map(ev => (<div key={ev.id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm group"><div className="flex items-center gap-3 overflow-hidden"><div className={`w-8 h-8 rounded flex items-center justify-center text-slate-500 bg-slate-100 flex-shrink-0`}><EvidenceIcon type={ev.type} /></div><div className="flex flex-col min-w-0">{ev.type === 'note' ? (<p className="text-sm text-slate-700 italic">"{ev.content}"</p>) : (<a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 truncate hover:text-blue-600">{ev.fileName}</a>)}<span className="text-[10px] text-slate-400">{ev.dateUploaded}</span></div></div><button onClick={() => removeEvidence(ind, ev.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-md"><Trash2 size={16} /></button></div>))}</div>
                                    {evidenceForm?.indId === ind.id ? (<div className="mt-2 bg-white p-3 rounded-lg border shadow-sm animate-fade-in"><div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-sm text-slate-700">Add {evidenceForm.type}</h4><button onClick={() => setEvidenceForm(null)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button></div>{evidenceForm.type === 'note' && <textarea autoFocus value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Type your note here..." className="w-full text-sm p-2 rounded-lg border bg-white focus:outline-none" rows={3}/>}{evidenceForm.type === 'link' && <input autoFocus type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full text-sm p-2 rounded-lg border bg-white focus:outline-none"/>}<button onClick={() => { const baseEvidence = { id: Math.random().toString(36).substring(7), dateUploaded: new Date().toISOString().split('T')[0] }; if (evidenceForm.type === 'note' && noteContent.trim()) onUpdateIndicator({ ...ind, evidence: [...ind.evidence, { ...baseEvidence, type: 'note', content: noteContent }] }); else if (evidenceForm.type === 'link' && linkUrl.trim()) onUpdateIndicator({ ...ind, evidence: [...ind.evidence, { ...baseEvidence, type: 'link', fileUrl: linkUrl, fileName: linkUrl }] }); setNoteContent(''); setLinkUrl(''); setEvidenceForm(null); }} className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg mt-2 font-semibold hover:bg-indigo-700">Add Evidence</button></div>) : 
                                    (<div className="mt-auto flex gap-2 pt-2 border-t border-slate-200/50"><label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 bg-white border text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm"><Upload size={14} /><span>File</span><input type="file" className="hidden" onChange={(e) => handleFileUpload(ind, e)}/></label><button onClick={() => setEvidenceForm({indId: ind.id, type: 'note'})} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm"><MessageSquare size={14} /><span>Note</span></button><button onClick={() => setEvidenceForm({indId: ind.id, type: 'link'})} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm"><LinkIcon size={14} /><span>Link</span></button></div>)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}})}
                    </div>
                </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedInds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-800 text-white rounded-xl shadow-2xl p-3 flex items-center gap-4 animate-fade-in-up">
          <span className="font-bold text-sm bg-slate-700 px-3 py-1 rounded-lg">{selectedInds.length}</span>
          <span className="font-medium text-sm text-slate-300">indicators selected</span>
          <div className="h-6 w-px bg-slate-600"></div>
          <div className="relative"><select onChange={(e) => handleBulkStatusChange(e.target.value as ComplianceStatus)} className="bg-indigo-600 text-white text-sm font-semibold pl-3 pr-8 py-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer" defaultValue=""><option value="" disabled>Change status...</option>{Object.values(ComplianceStatus).map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronsRight size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-200 pointer-events-none"/></div>
          <button onClick={() => setSelectedInds([])} className="text-slate-400 hover:text-white transition-colors p-2 -mr-1"><X size={18} /></button>
        </div>
      )}
    </div>
  );
};

export default Checklist;
