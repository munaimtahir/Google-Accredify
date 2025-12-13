
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Checklist from './components/Checklist';
import AIAssistant from './components/AIAssistant';
import Reports from './components/Reports';
import ProjectHub from './components/ProjectHub';
import UpcomingTasks from './components/UpcomingTasks';
import Converter from './components/Converter';
import AIAnalysis from './components/AIAnalysis';
import DocumentLibrary from './components/DocumentLibrary';
import AddProjectModal from './components/AddProjectModal';
import ManageIndicatorsModal from './components/ManageIndicatorsModal';
import EvidenceModal from './components/EvidenceModal';
import ManageFormModal from './components/ManageFormModal';
import AIComplianceGuideModal from './components/AIComplianceGuideModal';
import AIComplianceRunnerModal from './components/AIComplianceRunnerModal';
import { Indicator, Project, ComplianceStatus, Frequency, Evidence } from './types';
import { api } from './services/api';
import { Menu, Loader2 } from 'lucide-react';

export type View = 'projects' | 'dashboard' | 'upcoming' | 'checklist' | 'reports' | 'ai' | 'converter' | 'analysis' | 'library';

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
  
  const [isAIComplianceGuideModalOpen, setIsAIComplianceGuideModalOpen] = useState(false);
  const [guideIndicator, setGuideIndicator] = useState<Indicator | null>(null);

  const [isAIComplianceRunnerModalOpen, setIsAIComplianceRunnerModalOpen] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const evidenceIndicator = activeProject?.indicators.find(i => i.id === evidenceIndicatorId);

  // Load Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getProjects();
        setProjects(data);
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
      if (currentView === 'projects' || currentView === 'converter') setCurrentView('dashboard');
    } else {
      if (currentView !== 'converter') setCurrentView('projects');
    }
  }, [activeProjectId, currentView]);

  const handleUpdateIndicator = async (updatedInd: Indicator) => {
    if (!activeProjectId) return;
    
    // Optimistic UI update
    setProjects(prevProjects => prevProjects.map(proj => 
      proj.id === activeProjectId ? { ...proj, indicators: proj.indicators.map(ind => ind.id === updatedInd.id ? updatedInd : ind) } : proj
    ));

    try {
      await api.updateIndicator(activeProjectId, updatedInd);
    } catch (err) {
      console.error("Failed to sync update", err);
    }
  };

  const handleQuickLog = async (indicator: Indicator) => {
    if (!activeProjectId) return;
    try {
        const updatedInd = await api.quickLogIndicator(activeProjectId, indicator.id);
        // Update state with the confirmed data from the backend
        setProjects(prevProjects => prevProjects.map(proj => 
            proj.id === activeProjectId 
            ? { ...proj, indicators: proj.indicators.map(ind => ind.id === updatedInd.id ? updatedInd : ind) } 
            : proj
        ));
    } catch (err) {
        console.error("Failed to sync quick log", err);
    }
  };
  
  const handleAddEvidence = async (indicatorId: string, newEvidence: Omit<Evidence, 'id'>, file?: File) => {
    if (!activeProjectId) return;

    try {
        // Upload evidence (file included if present)
        const savedEvidence = await api.addEvidence(indicatorId, newEvidence, file);
        
        // Update UI state with returned evidence which contains backend URLs
        const projectToUpdate = projects.find(p => p.id === activeProjectId);
        const indicatorToUpdate = projectToUpdate?.indicators.find(ind => ind.id === indicatorId);
        
        if (indicatorToUpdate) {
            const updatedIndicator = {
                ...indicatorToUpdate,
                evidence: [...indicatorToUpdate.evidence, savedEvidence]
            };
            
            setProjects(prevProjects => prevProjects.map(proj => 
              proj.id === activeProjectId ? { ...proj, indicators: proj.indicators.map(ind => ind.id === updatedIndicator.id ? updatedIndicator : ind) } : proj
            ));
        }
    } catch (e) {
        console.error("Failed to add evidence", e);
        alert("Failed to upload evidence. Please try again.");
    }
  };

  const handleConnectDrive = async () => {
    if (!activeProjectId) return;
    try {
        const driveConfig = await api.connectGoogleDrive(activeProjectId);
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, driveConfig } : p));
        alert("Google Drive Connected Successfully!");
    } catch (e) {
        console.error(e);
        alert("Failed to connect Google Drive.");
    }
  };

  const handleSyncDrive = async () => {
    if (!activeProjectId) return;
    try {
        const updatedProject = await api.syncProjectToDrive(activeProjectId);
        setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
    } catch (e) {
        console.error(e);
    }
  };

  const handleSaveProject = async (projectData: { id?: string; name: string; description: string; }, csvFile: File | null) => {
    setModalMessage(null);
    setIsSubmitting(true);
    let analyzedIndicators: Indicator[] = [];

    if (csvFile) {
        try {
            let text = await csvFile.text();
            if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const header = lines[0]?.trim().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const expectedHeader = ["Section", "Standard", "Indicator", "Evidence Required", "Responsible Person", "Frequency", "Assigned to", "Compliance Evidence", "Score"];
            if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
                 setModalMessage({ type: 'error', text: `Invalid CSV header. Ensure it matches the template exactly.` }); setIsLoading(false); return;
            }
            const contentLines = lines.slice(1);
            const parsedIndicators = contentLines.map((line, idx) => {
                const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                const [section, standard, indicator, desc, resp, freqStr, assign, statStr, scoreStr] = cols;
                let status = Object.values(ComplianceStatus).find(s => s.toLowerCase() === statStr?.toLowerCase().trim()) || ComplianceStatus.NOT_STARTED;
                let freq = Object.values(Frequency).find(f => f.toLowerCase() === freqStr?.toLowerCase().trim()) || Frequency.ONE_TIME;
                return { 
                    id: `IND_${Date.now()}_${idx}`, // Temp ID for creation
                    section, standard, indicator, description: desc, score: parseInt(scoreStr) || 10, responsiblePerson: resp, frequency: freq, assignee: assign, status, evidence: [] 
                } as Indicator;
            });
            
            analyzedIndicators = await api.analyzeChecklist(parsedIndicators);
            
        } catch (error: any) {
            setModalMessage({ type: 'error', text: error.message || 'Failed to process CSV file.' });
            setIsSubmitting(false);
            return;
        }
    }
    
    if (projectData.id) { // Edit existing project
        const updatedProject = { ...projects.find(p => p.id === projectData.id)!, name: projectData.name, description: projectData.description };
        // Note: Simple update doesn't handle replacing indicators with CSV for simplicity in this demo
        setProjects(prev => prev.map(p => p.id === projectData.id ? updatedProject : p));
    } else { // Create new project
        const newProject: Project = {
          id: `temp_${Date.now()}`, 
          name: projectData.name, 
          description: projectData.description,
          indicators: analyzedIndicators,
          createdAt: new Date().toISOString().split('T')[0]
        };
        const savedProject = await api.createProject(newProject);
        setProjects(prev => [...prev, savedProject]);
        setActiveProjectId(savedProject.id);
    }

    setIsSubmitting(false);
    handleCloseModal();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        await api.deleteProject(projectId);
        if(activeProjectId === projectId) setActiveProjectId(null);
        setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };
  
  const handleAddIndicator = async (newIndData: Omit<Indicator, 'id' | 'evidence'>) => {
    if (!activeProjectId || !activeProject) return;
    const newIndicator: Indicator = { ...newIndData, id: `IND-${Date.now()}`, evidence: [] };
    const updatedProject = { ...activeProject, indicators: [...activeProject.indicators, newIndicator] };
    
    // In a real app we would POST to /indicators/ endpoint. For this architecture, we update via parent or dedicated endpoint
    // For simplicity, we assume indicator creation is handled or we use updateIndicator logic on project if we had it,
    // but here we just update local state and assume a refresh or specialized backend logic handles it.
    // Ideally: await api.createIndicator(activeProjectId, newIndicator)
    
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
  const handleOpenAIComplianceGuideModal = (indicator: Indicator) => { setGuideIndicator(indicator); setIsAIComplianceGuideModalOpen(true); };
  const handleCloseAIComplianceGuideModal = () => { setIsAIComplianceGuideModalOpen(false); setGuideIndicator(null); };

  const [isSubmitting, setIsSubmitting] = useState(false); // Add this state

  const renderView = () => {
    if (isLoading) return <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mb-2" /> Loading Projects...</div>;

    if (currentView === 'converter') {
        return <Converter />;
    }

    if (currentView === 'projects' || !activeProjectId || !activeProject) {
      return <ProjectHub projects={projects} onSelectProject={setActiveProjectId} onAddProject={handleOpenAddModal} onEditProject={handleOpenEditModal} onDeleteProject={handleDeleteProject} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard indicators={activeProject.indicators} onOpenAIComplianceRunner={() => setIsAIComplianceRunnerModalOpen(true)} />;
      case 'analysis': return <AIAnalysis indicators={activeProject.indicators} onOpenAIComplianceGuideModal={handleOpenAIComplianceGuideModal} onOpenManageFormModal={handleOpenManageFormModal} />;
      case 'upcoming': return <UpcomingTasks indicators={activeProject.indicators} onQuickLog={handleQuickLog} onManageEvidence={handleOpenEvidenceModal} onUpdateIndicator={handleUpdateIndicator} onOpenManageFormModal={handleOpenManageFormModal} onOpenAIComplianceGuideModal={handleOpenAIComplianceGuideModal} />;
      case 'checklist': return <Checklist indicators={activeProject.indicators} onUpdateIndicator={handleUpdateIndicator} onOpenManageModal={() => setIsManageIndicatorsModalOpen(true)} onOpenManageFormModal={handleOpenManageFormModal} onOpenAIComplianceGuideModal={handleOpenAIComplianceGuideModal} />;
      case 'reports': return <Reports indicators={activeProject.indicators} />;
      case 'library': return <DocumentLibrary project={activeProject} onConnectDrive={handleConnectDrive} onSyncDrive={handleSyncDrive} />;
      case 'ai': return <AIAssistant indicators={activeProject.indicators} />;
      default: return <Dashboard indicators={activeProject.indicators} onOpenAIComplianceRunner={() => setIsAIComplianceRunnerModalOpen(true)} />;
    }
  };

  const getHeaderTitle = () => {
      if (currentView === 'projects') return 'Project Hub';
      if (currentView === 'converter') return 'Document to CSV Converter';
      if (currentView === 'analysis') return 'AI Analysis & Auto-Fix';
      if (currentView === 'library') return 'Document Library';
      if (activeProject) return currentView.charAt(0).toUpperCase() + currentView.slice(1);
      return 'AccrediFy';
  }

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
             <div><h1 className="text-2xl font-bold text-slate-800">{getHeaderTitle()}</h1></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 lg:pt-0"><div className="max-w-7xl mx-auto h-full">{renderView()}</div></div>
      </main>
      <AddProjectModal isOpen={isAddProjectModalOpen} onClose={handleCloseModal} onSave={handleSaveProject} projectToEdit={editingProject} importStatus={modalMessage} />
      {activeProject && (<ManageIndicatorsModal isOpen={isManageIndicatorsModalOpen} onClose={() => setIsManageIndicatorsModalOpen(false)} onAddIndicator={handleAddIndicator} existingIndicators={activeProject.indicators} />)}
      {evidenceIndicator && (<EvidenceModal isOpen={isEvidenceModalOpen} onClose={handleCloseEvidenceModal} indicator={evidenceIndicator} onAddEvidence={handleAddEvidence} />)}
      {formIndicator && (<ManageFormModal isOpen={isManageFormModalOpen} onClose={handleCloseManageFormModal} indicator={formIndicator} onUpdateIndicator={handleUpdateIndicator} />)}
      {guideIndicator && (<AIComplianceGuideModal isOpen={isAIComplianceGuideModalOpen} onClose={handleCloseAIComplianceGuideModal} indicator={guideIndicator} onAddEvidence={handleAddEvidence} onUpdateIndicator={handleUpdateIndicator} />)}
      {activeProject && (<AIComplianceRunnerModal isOpen={isAIComplianceRunnerModalOpen} onClose={() => setIsAIComplianceRunnerModalOpen(false)} indicators={activeProject.indicators} onAddEvidence={handleAddEvidence} onUpdateIndicator={handleUpdateIndicator} />)}
    </div>
  );
};

export default App;
