

import React, { useMemo } from 'react';
import { Indicator, Frequency, ComplianceStatus } from '../types';
import { CalendarClock, CheckCircle, Clock, AlertTriangle, Calendar, RefreshCw, AlertCircle, FilePlus } from 'lucide-react';

interface UpcomingTasksProps {
  indicators: Indicator[];
  onQuickLog: (indicator: Indicator) => void;
  onManageEvidence: (indicatorId: string) => void;
}

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ indicators, onQuickLog, onManageEvidence }) => {
  
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

  const TaskCard: React.FC<{ item: any, isOverdue?: boolean }> = ({ item, isOverdue = false }) => {
    let bgClass = "bg-white border-slate-200";
    let iconColor = "bg-slate-100 text-slate-500";
    let Icon = CalendarClock;

    if (isOverdue) { bgClass = "bg-red-50 border-red-200"; iconColor = "bg-red-100 text-red-600"; Icon = AlertTriangle; } 
    else if (item.isResetDue) { bgClass = "bg-amber-50 border-amber-200"; iconColor = "bg-amber-100 text-amber-600"; Icon = AlertCircle; }

    const isActionable = !item.isDoneToday;

    return (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md ${bgClass}`}>
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
                  onClick={() => onQuickLog(item)}
                  disabled={!item.hasEvidenceToday}
                  title={!item.hasEvidenceToday ? "Please log evidence before marking as compliant" : "Mark as Compliant"}
                  className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-white border hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <RefreshCw size={14} /> Mark Compliant
                </button>
            ) : (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5"><CheckCircle size={14} /> Complete</div>
            )}
            <button onClick={() => onManageEvidence(item.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${ isOverdue ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}>
              <FilePlus size={16} /> Log Evidence
            </button>
          </div>
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
        <p className="text-slate-500">Track recurrent compliance activities and maintain your logs.</p>
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