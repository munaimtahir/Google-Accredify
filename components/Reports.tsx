import React, { useEffect, useState, useMemo } from 'react';
import { Indicator, ComplianceStatus } from '../types';
import { api } from '../services/api';
import { SECTION_COLORS } from '../constants';
import { FileDown, Printer, RefreshCw, FileText } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface ReportsProps {
  indicators: Indicator[];
}

const Reports: React.FC<ReportsProps> = ({ indicators }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    handleGenerateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
        const result = await api.generateComplianceReportSummary(indicators);
        setSummary(result || "Failed to generate summary.");
    } catch (error) {
        console.error("Failed to generate report summary", error);
        setSummary("Error: Could not generate AI summary. Please check the connection.");
    }
    setLoading(false);
  };

  const statusData = [
    { name: 'Compliant', value: indicators.filter(r => r.status === ComplianceStatus.COMPLIANT).length },
    { name: 'In Progress', value: indicators.filter(r => r.status === ComplianceStatus.IN_PROGRESS).length },
    { name: 'Not Started', value: indicators.filter(r => r.status === ComplianceStatus.NOT_STARTED).length },
    { name: 'Non-Compliant', value: indicators.filter(r => r.status === ComplianceStatus.NON_COMPLIANT).length },
  ];

  const groupedIndicators = useMemo(() => {
    const sections = new Map<string, Map<string, Indicator[]>>();
    for (const indicator of indicators) {
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
  }, [indicators]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none">
        
        <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">PHC Compliance Audit Report</h1>
            <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"><Printer size={16} /> Print</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"><FileDown size={16} /> Export PDF</button>
          </div>
        </div>

        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600" size={20}/>Executive Summary</h2>
                <button onClick={handleGenerateSummary} disabled={loading} className="text-slate-400 hover:text-blue-600 print:hidden" title="Regenerate with AI"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
            </div>
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 text-slate-700 leading-relaxed text-sm">
                {loading ? (<div className="flex items-center gap-2 text-slate-400"><RefreshCw className="animate-spin" size={16}/> Generating analysis...</div>) : (summary)}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Compliance Overview</h3>
                <div className="h-64 border rounded-lg p-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Pending Critical Actions</h3>
                 <ul className="space-y-3">
                    {indicators.filter(r => r.status === ComplianceStatus.NON_COMPLIANT || r.status === ComplianceStatus.NOT_STARTED).slice(0, 5).map(r => (
                        <li key={r.id} className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-100 text-sm">
                            <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                            <div><span className="font-semibold text-slate-800 block">{r.indicator}</span><span className="text-slate-500 text-xs">{r.standard} • {r.section}</span></div>
                        </li>
                    ))}
                    {indicators.filter(r => r.status === ComplianceStatus.NON_COMPLIANT || r.status === ComplianceStatus.NOT_STARTED).length === 0 && (
                        <li className="text-emerald-600 font-medium text-sm p-3 bg-emerald-50 rounded border border-emerald-100">No critical pending actions.</li>
                    )}
                 </ul>
            </div>
        </div>

        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Detailed Indicator Log</h3>
            <div className="space-y-8">
              {Array.from(groupedIndicators.entries()).map(([section, standards]) => (
                <div key={section}>
                  <h4 className="text-lg font-bold text-slate-700 mb-3 p-3 bg-slate-100 rounded-lg border-l-4" style={{borderColor: SECTION_COLORS[section] || '#64748b'}}>
                    {section}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="py-3 px-4 font-medium w-[25%]">Standard</th>
                          <th className="py-3 px-4 font-medium w-[45%]">Indicator</th>
                          <th className="py-3 px-4 font-medium text-center w-[15%]">Status</th>
                          <th className="py-3 px-4 font-medium text-center w-[15%]">Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Array.from(standards.entries()).flatMap(([standard, standardIndicators]) => 
                          standardIndicators.map((r, index) => (
                            <tr key={r.id}>
                              {index === 0 && (
                                <td rowSpan={standardIndicators.length} className="py-3 px-4 text-slate-600 font-medium align-top bg-slate-50/50 border-r border-slate-200">{standard}</td>
                              )}
                              <td className="py-3 px-4 font-medium text-slate-800">{r.indicator}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                  r.status === ComplianceStatus.COMPLIANT ? 'bg-emerald-100 text-emerald-700' :
                                  r.status === ComplianceStatus.NON_COMPLIANT ? 'bg-red-100 text-red-700' :
                                  r.status === ComplianceStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                  r.status === ComplianceStatus.NOT_APPLICABLE ? 'bg-slate-100 text-slate-600' :
                                  'bg-amber-100 text-amber-700'
                                }`}>{r.status}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-center">{r.evidence.length > 0 ? `${r.evidence.length} item(s)` : 'No'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
