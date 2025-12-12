import React, { useState } from 'react';
import { Project, ComplianceStatus, Indicator } from '../types';
import { Plus, ArrowRight, Layout, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface ProjectHubProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectHub: React.FC<ProjectHubProps> = ({ projects, onSelectProject, onAddProject, onEditProject, onDeleteProject }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const getProgress = (proj: Project) => {
    const applicableInds = proj.indicators.filter(r => r.status !== ComplianceStatus.NOT_APPLICABLE);
    if (applicableInds.length === 0) return 0;
    
    const totalScore = applicableInds.reduce((sum, ind) => sum + ind.score, 0);
    const achievedScore = applicableInds
        .filter(ind => ind.status === ComplianceStatus.COMPLIANT)
        .reduce((sum, ind) => sum + ind.score, 0);
        
    return totalScore > 0 ? Math.round((achievedScore / totalScore) * 100) : 0;
  };
  
  const handleMenuToggle = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === projectId ? null : projectId);
  };
  
  const handleEdit = (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      onEditProject(project);
      setActiveMenu(null);
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      onDeleteProject(projectId);
      setActiveMenu(null);
  };

  return (
    <div className="w-full h-full pb-10" onClick={() => setActiveMenu(null)}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          {/* Removed redundant header text as it's now in the main app header */}
          <div className="lg:hidden"> {/* Only show on mobile if needed, or hide completely since header is there */}
             <h2 className="text-xl font-bold text-slate-900">Projects</h2>
          </div>
          <button 
            onClick={onAddProject}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 ml-auto"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const progress = getProgress(project);
            const totalItems = project.indicators.length;
            const pendingItems = project.indicators.filter(r => r.status === ComplianceStatus.IN_PROGRESS || r.status === ComplianceStatus.NOT_STARTED).length;

            return (
              <div 
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative"
              >
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={(e) => handleMenuToggle(e, project.id)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <MoreVertical size={18} />
                    </button>
                    {activeMenu === project.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-100 z-20 animate-fade-in-up">
                            <button onClick={(e) => handleEdit(e, project)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Edit size={14}/> Edit</button>
                            <button onClick={(e) => handleDelete(e, project.id)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14}/> Delete</button>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Layout size={24} /></div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full mr-8"><Calendar size={12} />{project.createdAt}</div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-2">{project.description}</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      <span>Score</span><span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex gap-4">
                        <div className="flex flex-col"><span className="text-lg font-bold text-slate-800">{totalItems}</span><span className="text-[10px] text-slate-400 uppercase font-bold">Indicators</span></div>
                        <div className="flex flex-col"><span className="text-lg font-bold text-amber-500">{pendingItems}</span><span className="text-[10px] text-slate-400 uppercase font-bold">Pending</span></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><ArrowRight size={16} /></div>
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={onAddProject} className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:text-indigo-500 transition-all mb-4"><Plus size={32} /></div>
            <h3 className="text-lg font-bold text-slate-700 group-hover:text-indigo-700">Add New Accreditation</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-[200px]">Create a new compliance tracker or upload a CSV checklist</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHub;