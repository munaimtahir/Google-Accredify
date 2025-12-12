import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Indicator, ComplianceStatus } from '../types';
import { SECTION_COLORS } from '../constants';
import { Activity, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

interface DashboardProps {
  indicators: Indicator[];
}

const COLORS: Record<string, string> = {
  [ComplianceStatus.COMPLIANT]: '#10b981',
  [ComplianceStatus.IN_PROGRESS]: '#3b82f6',
  [ComplianceStatus.NOT_STARTED]: '#f59e0b',
  [ComplianceStatus.NON_COMPLIANT]: '#ef4444',
  [ComplianceStatus.NOT_APPLICABLE]: '#94a3b8',
};

const Dashboard: React.FC<DashboardProps> = ({ indicators }) => {
  const applicableInds = indicators.filter(r => r.status !== ComplianceStatus.NOT_APPLICABLE);
  
  const statusCounts = applicableInds.reduce((acc, ind) => {
    acc[ind.status] = (acc[ind.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData: { name: string; value: number }[] = Object.values(ComplianceStatus)
    .filter((status) => status !== ComplianceStatus.NOT_APPLICABLE)
    .map((status) => ({ name: status as string, value: statusCounts[status as string] || 0 }))
    .filter((item) => item.value > 0);

  const totalPossibleScore = applicableInds.reduce((sum, ind) => sum + ind.score, 0);
  const achievedScore = applicableInds
    .filter(ind => ind.status === ComplianceStatus.COMPLIANT)
    .reduce((sum, ind) => sum + ind.score, 0);
  const overallPercentage = totalPossibleScore > 0 ? Math.round((achievedScore / totalPossibleScore) * 100) : 0;
  
  const uniqueSections = [...new Set(applicableInds.map(r => r.section))];
  const sectionData = uniqueSections.map(section => {
    const sectionInds = applicableInds.filter(r => r.section === section);
    const totalScore = sectionInds.reduce((sum, ind) => sum + ind.score, 0);
    const compliantScore = sectionInds.filter(r => r.status === ComplianceStatus.COMPLIANT).reduce((sum, ind) => sum + ind.score, 0);
    return {
      name: section,
      completion: totalScore > 0 ? Math.round((compliantScore / totalScore) * 100) : 0
    };
  }).sort((a, b) => b.completion - a.completion);

  const compliantCount = statusCounts[ComplianceStatus.COMPLIANT] || 0;
  const totalInds = applicableInds.length;

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Activity size={24} /></div>
          <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Overall Score</p><h3 className="text-3xl font-bold text-slate-800">{overallPercentage}%</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle size={24} /></div>
          <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Compliant</p><h3 className="text-3xl font-bold text-slate-800">{compliantCount} <span className="text-sm text-slate-400 font-normal">/ {totalInds}</span></h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock size={24} /></div>
          <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending</p><h3 className="text-3xl font-bold text-slate-800">{(statusCounts[ComplianceStatus.NOT_STARTED] || 0) + (statusCounts[ComplianceStatus.IN_PROGRESS] || 0)}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600"><AlertCircle size={24} /></div>
          <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Attention</p><h3 className="text-3xl font-bold text-slate-800">{statusCounts[ComplianceStatus.NON_COMPLIANT] || 0}</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Compliance Status</h3>
            <button className="text-slate-400 hover:text-indigo-600"><TrendingUp size={20} /></button>
          </div>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as string]} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-6"><h3 className="text-lg font-bold text-slate-800">Section Readiness</h3></div>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={110} tick={{fontSize: 11, fill: '#64748b'}} interval={0} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="completion" name="Completion %" radius={[0, 4, 4, 0]}>
                   {sectionData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={SECTION_COLORS[entry.name as string] || '#94a3b8'} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;