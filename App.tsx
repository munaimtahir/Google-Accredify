

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Checklist from './components/Checklist';
import AIAssistant from './components/AIAssistant';
import Reports from './components/Reports';
import ProjectHub from './components/ProjectHub';
import UpcomingTasks from './components/UpcomingTasks';
import AddProjectModal from './components/AddProjectModal';
import ManageIndicatorsModal from './components/ManageIndicatorsModal';
import EvidenceModal from './components/EvidenceModal';
import ManageFormModal from './components/ManageFormModal';
import { Indicator, Project, ComplianceStatus, Frequency, Evidence } from './types';
import { api } from './services/api';
import { Menu, Loader2 } from 'lucide-react';

export type View = 'projects' | 'dashboard' | 'upcoming' | 'checklist' | 'reports' | 'ai';

// Logic for frontend "Mock" compliance refresh. 
// When connecting to Django, this function can be removed as backend handles it.
const refreshComplianceStatusLocally = (projects: Project[]): Project[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return projects.map(proj => {
    const updatedIndicators = proj.indicators.map(ind => {
      if (!ind.frequency || ind.frequency === Frequency.ONE_TIME) return ind;
      if (ind.status === ComplianceStatus.NON_COMPLIANT) return ind;

      if (!ind.lastUpdated) {
          if (ind.status === ComplianceStatus.COMPLIANT) {
              return { ...ind, status: ComplianceStatus.NOT_STARTED };
          }
          return ind;
      }

      const lastUpdate = new Date(ind.lastUpdated);
      lastUpdate.setHours(0, 0, 0, 0);
      let expiryDate = new Date(lastUpdate);
      
      switch(ind.frequency) {
          case Frequency.DAILY: expiryDate.setDate(lastUpdate.getDate() + 1); break;
          case Frequency.WEEKLY: expiryDate.setDate(lastUpdate.getDate() + 7); break;
          case Frequency.MONTHLY: expiryDate.setMonth(lastUpdate.getMonth() + 1); break;
          case Frequency.QUARTERLY: expiryDate.setMonth(lastUpdate.getMonth() + 3); break;
          case Frequency.ANNUALLY: expiryDate.setFullYear(lastUpdate.getFullYear() + 1); break;
      }

      if (today >= expiryDate && ind.status === ComplianceStatus.COMPLIANT) {
          return { ...ind, status: ComplianceStatus.NOT_STARTED };
      }
      return ind;
    });
    return { ...proj, indicators: updatedIndicators };
  });
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [isManageIndicatorsModalOpen, setIsManageIndicatorsModalOpen] = useState(false);
  
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceIndicatorId, setEvidenceIndicatorId] = useState<string | null>(null);

  const [isManageFormModalOpen, setIsManageFormModalOpen] = useState(false);
  const [formIndicator, setFormIndicator] = useState<Indicator | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const evidenceIndicator = activeProject?.indicators.find(i => i.id === evidenceIndicatorId);

  // Load Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getProjects();
        // We still run local refresh logic for the UI in this Mock mode
        // In real backend mode, the API would return already processed statuses
        setProjects(refreshComplianceStatusLocally(data));
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      if (currentView === 'projects') setCurrentView('dashboard');
    } else {
      setCurrentView('projects');
    }
  }, [activeProjectId, currentView]);

  const handleUpdateIndicator = async (updatedInd: Indicator) => {
    if (!activeProjectId) return;
    
    setProjects(prevProjects => prevProjects.map(proj => 
      proj.id === activeProjectId ? { ...proj, indicators: proj.indicators.map(ind => ind.id === updatedInd.id ? updatedInd : ind) } : proj
    ));

    try { await api.updateIndicator(activeProjectId, updatedInd); } 
    catch (err) { console.error("Failed to sync update", err); /* Revert UI if needed */ }
  };

  const handleQuickLog = async (indicator: Indicator) => {
    const updatedInd: Indicator = {
        ...indicator, status: ComplianceStatus.COMPLIANT,
        lastUpdated: new Date().toISOString().split('T')[0]
    };
    await handleUpdateIndicator(updatedInd);
  };
  
  const handleAddEvidence = async (indicatorId: string, newEvidence: Omit<Evidence, 'id'>) => {
    if (!activeProjectId) return;
    const evidenceWithId: Evidence = { ...newEvidence, id: `ev_${Date.now()}` };

    const indicatorToUpdate = activeProject?.indicators.find(ind => ind.id === indicatorId);
    if (indicatorToUpdate) {
        const updatedIndicator = {
            ...indicatorToUpdate,
            evidence: [...indicatorToUpdate.evidence, evidenceWithId]
        };
        await handleUpdateIndicator(updatedIndicator);
    }
  };

  const handleSaveProject = async (projectData: { id?: string; name: string; description: string; }, csvFile: File | null) => {
    setModalMessage(null);
    let newIndicators: Indicator[] = [];

    if (csvFile) {
        // CSV Parsing Logic remains the same
        let text = await csvFile.text();
        if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const header = lines[0]?.trim();
        const expectedHeader = "Section,Standard,Indicator,Evidence Required,Responsible Person,Frequency,Assigned to,Compliance Evidence,Score";
        
        if (header !== expectedHeader) {
            setModalMessage({ type: 'error', text: `Invalid CSV header.` });
            return;
        }
        const parseCsvLine = (line: string): string[] => {
            const result: string[] = []; let current = ''; let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"' && (i === 0 || line[i-1] !== '\\')) { inQuotes = !inQuotes; } 
                else if (char === ',' && !inQuotes) { result.push(current.replace(/^"|"$/g, '').trim()); current = ''; }
                else { current += char; }
            }
            result.push(current.replace(/^"|"$/g, '').trim()); return result;
        };
        const contentLines = lines.slice(1);
        contentLines.forEach((line, index) => {
             const cols = parseCsvLine(line.trim());
             if (cols.length === 9) {
                 const [section, standard, indicator, desc, resp, freqStr, assign, statStr, scoreStr] = cols;
                 let status = Object.values(ComplianceStatus).find(s => s.toLowerCase() === statStr?.toLowerCase().trim()) || ComplianceStatus.NON_COMPLIANT;
                 let freq = Object.values(Frequency).find(f => f.toLowerCase() === freqStr?.toLowerCase().trim());
                 newIndicators.push({
                     id: `NEW-${Date.now()}-${index}`, section, standard, indicator, description: desc,
                     score: parseInt(scoreStr) || 10, responsiblePerson: resp, frequency: freq, assignee: assign, status, evidence: []
                 });
             }
        });
    }

    const newProject: Project = {
        id: projectData.id || `proj_${Date.now()}`, name: projectData.name, description: projectData.description,
        indicators: projectData.id ? (activeProject?.indicators || []) : newIndicators,
        createdAt: new Date().toISOString().split('T')[0]
    };

    if (projectData.id) {
        setProjects(prev => prev.map(p => p.id === projectData.id ? { ...p, name: newProject.name, description: newProject.description } : p));
        // Add API call for updating project details
    } else {
        await api.createProject(newProject);
        setProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
    }
    handleCloseModal();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Delete project?')) {
        await api.deleteProject(projectId);
        if(activeProjectId === projectId) setActiveProjectId(null);
        setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };
  
  const handleAddIndicator = async (newIndData: Omit<Indicator, 'id' | 'evidence'>) => {
    if (!activeProjectId || !activeProject) return;
    const newIndicator: Indicator = { ...newIndData, id: `IND-${Date.now()}`, evidence: [] };
    const updatedProject = { ...activeProject, indicators: [...activeProject.indicators, newIndicator] };
    await handleUpdateIndicator(newIndicator); // This is simplified, real API would be better
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
    setIsManageIndicatorsModalOpen(false);
  };
  
  const handleOpenEditModal = (project: Project) => { setEditingProject(project); setIsAddProjectModalOpen(true); };
  const handleOpenAddModal = () => { setEditingProject(null); setIsAddProjectModalOpen(true); };
  const handleCloseModal = () => { setIsAddProjectModalOpen(false); setEditingProject(null); setModalMessage(null); };
  const handleSwitchToProjects = () => { setActiveProjectId(null); setCurrentView('projects'); };
  const handleOpenEvidenceModal = (indicatorId: string) => { setEvidenceIndicatorId(indicatorId); setIsEvidenceModalOpen(true); };
  const handleCloseEvidenceModal = () => { setIsEvidenceModalOpen(false); setEvidenceIndicatorId(null); };
  const handleOpenManageFormModal = (indicator: Indicator) => { setFormIndicator(indicator); setIsManageFormModalOpen(true); };
  const handleCloseManageFormModal = () => { setIsManageFormModalOpen(false); setFormIndicator(null); };

  const renderView = () => {
    if (isLoading) return <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mb-2" /> Loading...</div>;

    if (currentView === 'projects' || !activeProjectId || !activeProject) {
      return <ProjectHub projects={projects} onSelectProject={setActiveProjectId} onAddProject={handleOpenAddModal} onEditProject={handleOpenEditModal} onDeleteProject={handleDeleteProject} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard indicators={activeProject.indicators} />;
      case 'upcoming': return <UpcomingTasks indicators={activeProject.indicators} onQuickLog={handleQuickLog} onManageEvidence={handleOpenEvidenceModal} />;
      case 'checklist': return <Checklist indicators={activeProject.indicators} onUpdateIndicator={handleUpdateIndicator} onOpenManageModal={() => setIsManageIndicatorsModalOpen(true)} onOpenManageFormModal={handleOpenManageFormModal} />;
      case 'reports': return <Reports indicators={activeProject.indicators} />;
      case 'ai': return <AIAssistant indicators={activeProject.indicators} />;
      default: return <Dashboard indicators={activeProject.indicators} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={currentView} onChangeView={setCurrentView} 
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSwitchProject={handleSwitchToProjects} projectName={activeProject?.name} isProjectActive={!!activeProjectId}
      />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between lg:hidden shrink-0">
            <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-500"><Menu size={24} /></button><h1 className="text-sm font-bold text-slate-800">{activeProject?.name || 'AccrediFy'}</h1></div>
        </header>
        <div className="hidden lg:flex px-8 py-6 items-center justify-between shrink-0">
             <div><h1 className="text-2xl font-bold text-slate-800">{currentView === 'projects' ? 'Project Hub' : currentView.charAt(0).toUpperCase() + currentView.slice(1)}</h1></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 lg:pt-0"><div className="max-w-7xl mx-auto h-full">{renderView()}</div></div>
      </main>
      <AddProjectModal isOpen={isAddProjectModalOpen} onClose={handleCloseModal} onSave={handleSaveProject} projectToEdit={editingProject} importStatus={modalMessage} />
      {activeProject && (<ManageIndicatorsModal isOpen={isManageIndicatorsModalOpen} onClose={() => setIsManageIndicatorsModalOpen(false)} onAddIndicator={handleAddIndicator} existingIndicators={activeProject.indicators} />)}
      {evidenceIndicator && (<EvidenceModal isOpen={isEvidenceModalOpen} onClose={handleCloseEvidenceModal} indicator={evidenceIndicator} onAddEvidence={handleAddEvidence} />)}
      {formIndicator && (<ManageFormModal isOpen={isManageFormModalOpen} onClose={handleCloseManageFormModal} indicator={formIndicator} onUpdateIndicator={handleUpdateIndicator} />)}
    </div>
  );
};

export default App;