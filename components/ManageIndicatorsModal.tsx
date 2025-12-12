import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { Indicator, ComplianceStatus, Frequency } from '../types';

interface ManageIndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIndicator: (newIndData: Omit<Indicator, 'id' | 'evidence'>) => void;
  existingIndicators: Indicator[];
}

const ManageIndicatorsModal: React.FC<ManageIndicatorsModalProps> = ({ isOpen, onClose, onAddIndicator, existingIndicators }) => {
  const [section, setSection] = useState('');
  const [newSection, setNewSection] = useState('');
  const [standard, setStandard] = useState('');
  const [newStandard, setNewStandard] = useState('');
  const [indicator, setIndicator] = useState('');
  const [description, setDescription] = useState('');
  const [score, setScore] = useState(10);
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [frequency, setFrequency] = useState<Frequency | ''>('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<ComplianceStatus>(ComplianceStatus.NOT_STARTED);
  
  const { uniqueSections, standardsBySection } = useMemo(() => {
    const sections = new Set<string>();
    const standards = new Map<string, Set<string>>();
    for (const ind of existingIndicators) {
      sections.add(ind.section);
      if (!standards.has(ind.section)) {
        standards.set(ind.section, new Set<string>());
      }
      standards.get(ind.section)!.add(ind.standard);
    }
    return { uniqueSections: Array.from(sections), standardsBySection: standards };
  }, [existingIndicators]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSection = section === 'new' ? newSection : section;
    const finalStandard = standard === 'new' ? newStandard : standard;

    if (indicator.trim() && finalSection.trim() && finalStandard.trim()) {
      onAddIndicator({
        section: finalSection, standard: finalStandard, indicator, description, score,
        responsiblePerson, frequency: frequency || undefined, assignee, status,
      });
      // Reset form
      setSection(''); setNewSection(''); setStandard(''); setNewStandard('');
      setIndicator(''); setDescription(''); setScore(10);
      setResponsiblePerson(''); setFrequency(''); setAssignee(''); setStatus(ComplianceStatus.NOT_STARTED);
    }
  };
  
  const canSubmit = indicator.trim() && (section === 'new' ? newSection.trim() : section) && (standard === 'new' ? newStandard.trim() : standard);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Add New Indicator</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Indicator</label>
              <input type="text" required value={indicator} onChange={(e) => setIndicator(e.target.value)} placeholder="e.g., Annual Fire Drill" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Evidence Required Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the proof needed..." className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 h-20 resize-none"/>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
              <select required value={section} onChange={e => { setSection(e.target.value); setStandard(''); }} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="" disabled>Select a section</option>
                {uniqueSections.map(a => <option key={a} value={a}>{a}</option>)}
                <option value="new">-- Create New Section --</option>
              </select>
            </div>
             {section === 'new' && (
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">New Section Name</label><input type="text" required value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g., Quality Control" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"/></div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Standard</label>
              <select required value={standard} onChange={e => setStandard(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white" disabled={!section || section === 'new'}>
                <option value="" disabled>Select a standard</option>
                {section && standardsBySection.has(section) && Array.from(standardsBySection.get(section)!).map(s => <option key={s} value={s}>{s}</option>)}
                <option value="new">-- Create New Standard --</option>
              </select>
            </div>
             {standard === 'new' && (
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">New Standard Name</label><input type="text" required value={newStandard} onChange={e => setNewStandard(e.target.value)} placeholder="e.g., PHC-SAF-05" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"/></div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Score</label>
              <input type="number" value={score} onChange={e => setScore(parseInt(e.target.value, 10) || 0)} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="" disabled>Select frequency</option>
                {Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned To</label>
              <input type="text" value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="e.g., John Doe" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ComplianceStatus)} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white">
                {Object.values(ComplianceStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-6 mt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={!canSubmit} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Plus size={18} /> Add Indicator
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageIndicatorsModal;