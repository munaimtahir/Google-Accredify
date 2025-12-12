import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertTriangle, Info, Loader2, Download } from 'lucide-react';
import { Project } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: { id?: string; name: string; description: string; }, csvFile: File | null) => Promise<void>;
  projectToEdit?: Project | null;
  importStatus?: { type: 'success' | 'error' | 'warning', text: string } | null;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSave, projectToEdit, importStatus }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setName(projectToEdit.name);
        setDescription(projectToEdit.description);
      } else {
        setName('');
        setDescription('');
        setFile(null);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, projectToEdit]);
  
  const handleDownloadTemplate = () => {
    const header = "Section,Standard,Indicator,Evidence Required,Responsible Person,Frequency,Assigned to,Compliance Evidence,Score\n";
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "accredify_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      await onSave({ id: projectToEdit?.id, name, description }, file);
      setIsSubmitting(false);
    }
  };
  
  const isEditing = !!projectToEdit;

  const getStatusIcon = () => {
    if (!importStatus) return null;
    switch (importStatus.type) {
        case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
        case 'warning': return <Info className="h-5 w-5 text-amber-500" />;
        case 'success': return <Check className="h-5 w-5 text-emerald-500" />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Project' : 'New Accreditation Project'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., ISO 15189 Accreditation" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe the purpose of this compliance checklist..." className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 h-24 resize-none"/>
            </div>
            {!isEditing && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Checklist (CSV)</label>
                <div className="relative group">
                  <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isSubmitting}/>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 group-hover:border-indigo-400'}`}>
                    {file ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700">
                        <FileSpreadsheet size={24} /><span className="font-medium text-sm truncate max-w-[200px]">{file.name}</span><Check size={16} className="bg-emerald-200 rounded-full p-0.5" />
                      </div>
                    ) : (
                      <div className="space-y-2"><div className="mx-auto w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><Upload size={20} /></div><p className="text-sm font-medium text-slate-600">Click to upload CSV</p></div>
                    )}
                  </div>
                </div>
                 <div className="text-xs text-slate-500 mt-3 p-3 bg-slate-50 rounded-lg border">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-slate-600">CSV must have these exact columns:</p>
                      <button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-[11px]"><Download size={12}/>Download Template</button>
                    </div>
                    <pre className="text-slate-600 bg-slate-200/50 p-2 rounded text-[10px] overflow-x-auto">Section,Standard,Indicator,Evidence Required,Responsible Person,Frequency,Assigned to,Compliance Evidence,Score</pre>
                  </div>
              </div>
            )}
            {importStatus && (
                <div className={`flex items-start gap-3 p-4 rounded-lg text-sm ${
                    importStatus.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                    importStatus.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                    'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                    <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
                    <div><p className="font-semibold">{importStatus.type.charAt(0).toUpperCase() + importStatus.type.slice(1)}</p><p>{importStatus.text}</p></div>
                </div>
            )}
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || !name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              {isSubmitting ? 'Processing...' : isEditing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;
