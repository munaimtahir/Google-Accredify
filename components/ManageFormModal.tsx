import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { Indicator, FormField } from '../types';

interface ManageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator;
  onUpdateIndicator: (updatedIndicator: Indicator) => void;
}

const ManageFormModal: React.FC<ManageFormModalProps> = ({ isOpen, onClose, indicator, onUpdateIndicator }) => {
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    if (indicator.formSchema) {
      setFields(JSON.parse(JSON.stringify(indicator.formSchema)));
    } else {
      setFields([]);
    }
  }, [indicator]);

  if (!isOpen) return null;

  const handleFieldChange = (index: number, prop: keyof FormField, value: any) => {
    const newFields = [...fields];
    (newFields[index] as any)[prop] = value;
    if (prop === 'label') {
      newFields[index].name = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    setFields(newFields);
  };
  
  const handleCheckboxChange = (index: number, prop: keyof FormField, checked: boolean) => {
    const newFields = [...fields];
    (newFields[index] as any)[prop] = checked;
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { name: `new_field_${fields.length}`, label: '', type: 'text', required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    const updatedIndicator = { ...indicator, formSchema: fields };
    onUpdateIndicator(updatedIndicator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Manage Digital Form</h2>
            <p className="text-sm text-slate-500 truncate max-w-md">{indicator.indicator}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
            {fields.map((field, index) => (
                <div key={index} className="p-4 bg-slate-50 border rounded-xl flex items-start gap-4">
                    <GripVertical size={20} className="text-slate-400 mt-8 cursor-grab flex-shrink-0"/>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Field Label</label>
                            <input type="text" value={field.label} onChange={e => handleFieldChange(index, 'label', e.target.value)} placeholder="e.g., Waste Weight (kg)" className="w-full text-sm p-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Field Type</label>
                            <select value={field.type} onChange={e => handleFieldChange(index, 'type', e.target.value)} className="w-full text-sm p-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="textarea">Text Area</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <input type="checkbox" id={`required-${index}`} checked={!!field.required} onChange={e => handleCheckboxChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                                <label htmlFor={`required-${index}`} className="text-sm text-slate-700 select-none">Required Field</label>
                            </div>
                            <button onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1"><Trash2 size={14}/> Remove</button>
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={addField} className="w-full mt-4 p-3 border-2 border-dashed rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                <Plus size={16}/> Add Field
            </button>
        </div>

        <div className="flex gap-3 p-6 mt-2 border-t border-slate-200 bg-slate-50">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Form Schema</button>
        </div>
      </div>
    </div>
  );
};

export default ManageFormModal;