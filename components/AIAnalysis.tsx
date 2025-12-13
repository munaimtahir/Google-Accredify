
import React, { useState } from 'react';
import { Indicator, ComplianceStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Bot, FileText, Wrench, Sparkles, Loader2, CheckCircle, ArrowRight, BrainCircuit } from 'lucide-react';
import { api } from '../services/api';

interface AIAnalysisProps {
  indicators: Indicator[];
  onOpenAIComplianceGuideModal: (indicator: Indicator) => void;
  onOpenManageFormModal: (indicator: Indicator) => void;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ indicators, onOpenAIComplianceGuideModal, onOpenManageFormModal }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [categorization, setCategorization] = useState<{
      ai_fully_manageable: string[],
      ai_assisted: string[],
      manual: string[]
  } | null>(null);

  const statusCounts = indicators.reduce((acc, ind) => {
    acc[ind.status] = (acc[ind.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Compliant', value: statusCounts[ComplianceStatus.COMPLIANT] || 0, color: '#10b981' },
    { name: 'Started / In Progress', value: statusCounts[ComplianceStatus.IN_PROGRESS] || 0, color: '#3b82f6' },
    { name: 'Non-Compliant / Not Started', value: (statusCounts[ComplianceStatus.NON_COMPLIANT] || 0) + (statusCounts[ComplianceStatus.NOT_STARTED] || 0), color: '#ef4444' },
  ].filter(d => d.value > 0);

  const handleDeepAnalysis = async () => {
    setAnalyzing(true);
    try {
        const result = await api.analyzeComplianceCategorization(indicators);
        setCategorization(result);
    } catch (e) {
        console.error(e);
    } finally {
        setAnalyzing(false);
    }
  };

  const getIndicatorById = (id: string) => indicators.find(i => i.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BrainCircuit className="text-indigo-600"/> AI Compliance Analysis
                </h1>
                <p className="text-slate-500 mt-1">Intelligent breakdown of your compliance gaps and automated solutions.</p>
            </div>
            {!categorization && (
                <button 
                    onClick={handleDeepAnalysis} 
                    disabled={analyzing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
                >
                    {analyzing ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}
                    {analyzing ? 'Analyzing Checklist...' : 'Run Auto-Analysis'}
                </button>
            )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Current Status Distribution</h3>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }}/>
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 rounded-2xl p-8 flex flex-col justify-center items-start">
                 <h2 className="text-2xl font-bold text-indigo-900 mb-4">How AI Can Help</h2>
                 <p className="text-indigo-700 mb-6 max-w-2xl leading-relaxed">
                     Our AI engine can scan your non-compliant items and sort them into actionable workflows. 
                     It distinguishes between documentation tasks (which it can write for you), logging tasks (where it creates the forms), 
                     and physical tasks (where it offers guidance).
                 </p>
                 {!categorization && !analyzing && (
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={handleDeepAnalysis}>
                        Start the analysis now <ArrowRight size={18}/>
                    </div>
                 )}
            </div>
        </div>

        {analyzing && (
            <div className="py-20 text-center">
                 <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-4"/>
                 <h3 className="text-xl font-bold text-slate-700">Categorizing Compliance Tasks...</h3>
                 <p className="text-slate-500">Evaluating descriptions and evidence requirements.</p>
            </div>
        )}

        {categorization && (
            <div className="grid lg:grid-cols-3 gap-8 animate-fade-in-up">
                {/* Column 1: Fully AI Manageable */}
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col h-full">
                    <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Bot size={20}/>
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-900">Fully AI Manageable</h3>
                            <p className="text-xs text-emerald-700">Policies, SOPs, Missions</p>
                        </div>
                        <span className="ml-auto bg-white text-emerald-700 font-bold px-2 py-1 rounded-lg text-xs border border-emerald-100">{categorization.ai_fully_manageable.length}</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                        {categorization.ai_fully_manageable.length === 0 ? <p className="text-sm text-slate-400 italic p-4 text-center">No items in this category.</p> : 
                         categorization.ai_fully_manageable.map(id => {
                             const item = getIndicatorById(id);
                             if(!item) return null;
                             return (
                                 <div key={id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors group">
                                     <p className="font-semibold text-sm text-slate-800 mb-1">{item.indicator}</p>
                                     <button onClick={() => onOpenAIComplianceGuideModal(item)} className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Sparkles size={12}/> Generate Doc
                                     </button>
                                 </div>
                             );
                         })
                        }
                    </div>
                </div>

                {/* Column 2: AI Assisted */}
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden flex flex-col h-full">
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FileText size={20}/>
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">AI Assisted</h3>
                            <p className="text-xs text-blue-700">Logs, Rosters, Forms</p>
                        </div>
                        <span className="ml-auto bg-white text-blue-700 font-bold px-2 py-1 rounded-lg text-xs border border-blue-100">{categorization.ai_assisted.length}</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                        {categorization.ai_assisted.length === 0 ? <p className="text-sm text-slate-400 italic p-4 text-center">No items in this category.</p> : 
                         categorization.ai_assisted.map(id => {
                             const item = getIndicatorById(id);
                             if(!item) return null;
                             return (
                                 <div key={id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
                                     <p className="font-semibold text-sm text-slate-800 mb-1">{item.indicator}</p>
                                     <button onClick={() => onOpenManageFormModal(item)} className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <FileText size={12}/> Create Form
                                     </button>
                                 </div>
                             );
                         })
                        }
                    </div>
                </div>

                {/* Column 3: Manual */}
                <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden flex flex-col h-full">
                    <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Wrench size={20}/>
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900">Physical Action</h3>
                            <p className="text-xs text-amber-700">Repairs, Purchases, Checks</p>
                        </div>
                        <span className="ml-auto bg-white text-amber-700 font-bold px-2 py-1 rounded-lg text-xs border border-amber-100">{categorization.manual.length}</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                        {categorization.manual.length === 0 ? <p className="text-sm text-slate-400 italic p-4 text-center">No items in this category.</p> : 
                         categorization.manual.map(id => {
                             const item = getIndicatorById(id);
                             if(!item) return null;
                             return (
                                 <div key={id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors group">
                                     <p className="font-semibold text-sm text-slate-800 mb-1">{item.indicator}</p>
                                     <button onClick={() => onOpenAIComplianceGuideModal(item)} className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Bot size={12}/> Get Advice
                                     </button>
                                 </div>
                             );
                         })
                        }
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AIAnalysis;
