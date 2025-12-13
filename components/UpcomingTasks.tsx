
import React, { useMemo, useState } from 'react';
import { Indicator, Frequency, ComplianceStatus, Evidence } from '../types';
import { 
  CalendarClock, CheckCircle, Clock, AlertTriangle, Calendar, RefreshCw, AlertCircle, FilePlus,
  ChevronDown, ChevronUp, Trash2, FileText, Link as LinkIcon, MessageSquare, ClipboardEdit, Sparkles
} from 'lucide-react';

interface UpcomingTasksProps {
  indicators: Indicator[];
  onQuickLog: (indicator: Indicator) => void;
  onManageEvidence: (indicatorId: string) => void;
  onUpdateIndicator: (indicator: Indicator) => void;
  onOpenManageFormModal: (indicator: Indicator) => void;
  onOpenAIComplianceGuideModal: (indicator: Indicator) => void;
}

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ 
  indicators, 
  onQuickLog, 
  onManageEvidence, 
  onUpdateIndicator, 
  onOpenManageFormModal, 
  onOpenAIComplianceGuideModal 
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const processTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tasks = {
      overdue: [] as any[],
      daily: [] as any[],
      weekly: [] as any[],
      monthly: [] as any[]
    };

    indicators.filter(ind => ind.frequency && ind.frequency !== Frequency.ONE_TIME).forEach(ind => {
      let nextDueDate = new Date();
      let isOverdue = false;
      let lastUpdatedDate = ind.lastUpdated ? new Date(ind.lastUpdated) : null;

      if (lastUpdatedDate) {
        lastUpdatedDate.setHours(0, 0, 0, 0);
        const next = new Date(lastUpdatedDate);
        
        switch (ind.frequency) {
          case Frequency.DAILY: next.setDate(lastUpdatedDate.getDate() + 1); break;
          case Frequency.WEEKLY: next.setDate(lastUpdatedDate.getDate() + 7); break;
          case Frequency.MONTHLY: next.setMonth(lastUpdatedDate.getMonth() + 1); break;
          case Frequency.QUARTERLY: next.setMonth(lastUpdatedDate.getMonth() + 3); break;
          case Frequency.ANNUALLY: next.setFullYear(lastUpdatedDate.getFullYear() + 1); break;
        }
        nextDueDate = next;
      } else {
        nextDueDate = new Date(); 
        nextDueDate.setDate(nextDueDate.getDate() - 1); 
      }

      if (nextDueDate < today) isOverdue = true;
      const isDoneToday = lastUpdatedDate && lastUpdatedDate.getTime() === today.getTime();
      const isResetDue = ind.status === ComplianceStatus.NOT_STARTED && !isOverdue && !isDoneToday;
      const hasEvidenceToday = ind.evidence.some(ev => ev.dateUploaded === todayStr);

      const taskItem = { ...ind, nextDueDate, daysOverdue: isOverdue ? Math.ceil((today.getTime() - nextDueDate.getTime()) / (1000 * 3600 * 24)) : 0, isDoneToday, isResetDue, hasEvidenceToday };

      if (isOverdue && !isDoneToday) tasks.overdue.push(taskItem);
      else {
        if (ind.frequency === Frequency.DAILY) tasks.daily.push(taskItem);
        else if (ind.frequency === Frequency.WEEKLY) tasks.weekly.push(taskItem);
        else tasks.monthly.push(taskItem);
      }
    });

    tasks.overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
    return tasks;
  }, [indicators]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleFieldChange = (ind: Indicator, field: keyof Indicator, value: any) => {
    onUpdateIndicator({ ...ind, [field]: value });
  };

  const removeEvidence = (ind: Indicator, evidenceId: string) => {
    onUpdateIndicator({ ...ind, evidence: ind.evidence.filter(e => e.id !== evidenceId) });
  };

  const EvidenceIcon = ({ type }: { type: Evidence['type'] }) => {
      switch (type) {
          case 'note': return <MessageSquare size={16} />; case 'link': return <LinkIcon size={16} />;
          default: return <FileText size={16} />;
      }
  };

  const TaskCard: React.FC<{ item: any, isOverdue?: boolean }> = ({ item, isOverdue = false }) => {
    let bgClass = "bg-white border-slate-200";
    let iconColor = "bg-slate-100 text-slate-500";
    let Icon = CalendarClock;

    if (isOverdue) { bgClass = "bg-red-50 border-red-200"; iconColor = "bg-red-100 text-red-600"; Icon = AlertTriangle; } 
    else if (item.isResetDue) { bgClass = "bg-amber-50 border-amber-200"; iconColor = "bg-amber-100 text-amber-600"; Icon = AlertCircle; }

    const isActionable = !item.isDoneToday;
    const isExpanded = expandedId === item.id;

    return (
        <div className={`rounded-xl border transition-all hover:shadow-md overflow-hidden ${bgClass}`}>
            <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => toggleExpand(item.id)}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-full flex-shrink-0 ${iconColor}`}><Icon size={20} /></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-200 text-red-800' : 'bg-slate-100 text-slate-600'}`}>{item.frequency}</span>
                     {item.evidence.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{item.evidence.length} evidence</span>}
                  </div>
                  <h4 className={`font-semibold ${isOverdue ? 'text-red-900' : 'text-slate-800'}`}>{item.indicator}</h4>
                  <div className="flex items-center gap-4 mt-2 text-xs font-medium">
                     <span className={isOverdue ? 'text-red-600' : item.isResetDue ? 'text-amber-600' : 'text-slate-500'}>
                       {isOverdue ? `Overdue by ${item.daysOverdue} days` : item.isDoneToday ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> Compliant Today</span> : item.isResetDue ? `Action Required Today` : `Next Due: ${item.nextDueDate.toLocaleDateString()}`}
                     </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0 md:pl-4">
                {isActionable ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onQuickLog(item); }}
                      disabled={!item.hasEvidenceToday}
                      title={!item.hasEvidenceToday ? "Please log evidence before marking as compliant" : "Mark as Compliant"}
                      className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-white border hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      <RefreshCw size={14} /> Mark Compliant
                    </button>
                ) : (
                    <div className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5"><CheckCircle size={14} /> Complete</div>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onManageEvidence(item.id); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${ isOverdue ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
                >
                  <FilePlus size={16} /> Log Evidence
                </button>
                <div className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </div>
              </div>
            </div>

            {/* Expanded Detail View */}
            {isExpanded && (
                <div className="p-6 pt-0 border-t border-slate-200/60 bg-slate-50/50 animate-fade-in cursor-default" onClick={(e) => e.stopPropagation()}>
                    <div className="pt-4 grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Evidence Required</label>
                                <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border">{item.description}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Status (Manual)</label>
                                    <div className="relative">
                                        <select value={item.status} onChange={(e) => handleFieldChange(item, 'status', e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 appearance-none">
                                            {Object.values(ComplianceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Frequency</label>
                                    <div className="relative">
                                        <select value={item.frequency || Frequency.ONE_TIME} onChange={(e) => handleFieldChange(item, 'frequency', e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 appearance-none">
                                            {Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Assigned To</label>
                                    <input type="text" placeholder="Unassigned" value={item.assignee || ''} onChange={(e) => handleFieldChange(item, 'assignee', e.target.value)} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Score</label>
                                    <input type="number" value={item.score} onChange={(e) => handleFieldChange(item, 'score', parseInt(e.target.value, 10))} className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onOpenManageFormModal(item)} className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-lg transition-colors border border-slate-200">
                                    <ClipboardEdit size={16} /> Manage Form
                                </button>
                                    <button onClick={() => onOpenAIComplianceGuideModal(item)} className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2.5 rounded-lg transition-colors border border-indigo-200">
                                    <Sparkles size={16} /> AI Guide
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 flex justify-between items-center">
                                <span>Evidence Uploads</span>
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">{item.evidence.length} items</span>
                            </label>
                            <div className="bg-slate-100/50 rounded-xl border border-dashed p-4 min-h-[140px] flex flex-col gap-3">
                                {item.evidence.length === 0 ? (
                                    <div className="h-full flex-1 flex flex-col items-center justify-center text-slate-400 py-4">
                                        <FileText size={20} className="text-slate-300 mb-2"/>
                                        <span className="text-xs font-medium">No documents uploaded yet.</span>
                                        <button onClick={() => onManageEvidence(item.id)} className="text-indigo-600 text-xs font-bold mt-2 hover:underline">Click "Log Evidence" above to add</button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {item.evidence.map((ev: Evidence) => (
                                            <div key={ev.id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-8 h-8 rounded flex items-center justify-center text-slate-500 bg-slate-100 flex-shrink-0`}>
                                                        <EvidenceIcon type={ev.type} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        {ev.type === 'note' ? (
                                                            <p className="text-sm text-slate-700 italic">"{ev.content}"</p>
                                                        ) : (
                                                            <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 truncate hover:text-blue-600">{ev.fileName}</a>
                                                        )}
                                                        <span className="text-[10px] text-slate-400">{ev.dateUploaded}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeEvidence(item, ev.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-md">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const SectionHeader = ({ title, count, colorClass, icon: Icon }: any) => (
    <div className="flex items-center gap-3 mb-4 mt-8">
      <div className={`p-2 rounded-lg ${colorClass}`}><Icon size={20} /></div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Upcoming Tasks</h1>
        <p className="text-slate-500">Track recurrent compliance activities. Click on a task to view details or update parameters.</p>
      </div>

      {processTasks.overdue.length > 0 && (
        <div className="mb-8 animate-fade-in">
           <SectionHeader title="Action Required (Overdue)" count={processTasks.overdue.length} colorClass="bg-red-100 text-red-600" icon={AlertTriangle} />
           <div className="space-y-3">
             {processTasks.overdue.map(item => <TaskCard key={item.id} item={item} isOverdue={true} />)}
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
           <SectionHeader title="Daily Tasks" count={processTasks.daily.length} colorClass="bg-blue-100 text-blue-600" icon={Clock} />
           {processTasks.daily.length === 0 ? <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">No daily tasks configured.</div> : <div className="space-y-3">{processTasks.daily.map(item => <TaskCard key={item.id} item={item} />)}</div>}
        </div>
        <div>
           <SectionHeader title="Weekly Tasks" count={processTasks.weekly.length} colorClass="bg-violet-100 text-violet-600" icon={Calendar} />
           {processTasks.weekly.length === 0 ? <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">No weekly tasks configured.</div> : <div className="space-y-3">{processTasks.weekly.map(item => <TaskCard key={item.id} item={item} />)}</div>}
        </div>
      </div>

      <div className="mt-8">
          <SectionHeader title="Monthly & Periodic" count={processTasks.monthly.length} colorClass="bg-emerald-100 text-emerald-600" icon={Calendar} />
           {processTasks.monthly.length === 0 ? <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">No periodic tasks configured.</div> : <div className="space-y-3">{processTasks.monthly.map(item => <TaskCard key={item.id} item={item} />)}</div>}
      </div>
    </div>
  );
};

export default UpcomingTasks;
