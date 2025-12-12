
import { Project, Indicator, Evidence, ComplianceStatus } from '../types';
import { INITIAL_PROJECTS } from '../constants';

// --- CONFIGURATION ---
// Set this to FALSE when your Django backend is running
const USE_MOCK_DATA = true;
const API_BASE_URL = 'http://localhost:8000/api';

// --- MOCK STORAGE ---
// We use localStorage to simulate a database persistence in the browser for now
const loadMockData = (): Project[] => {
  const stored = localStorage.getItem('accredify_projects');
  return stored ? JSON.parse(stored) : INITIAL_PROJECTS;
};

const saveMockData = (projects: Project[]) => {
  localStorage.setItem('accredify_projects', JSON.stringify(projects));
};

// --- API SERVICE ---

export const api = {
  // 1. GET ALL PROJECTS
  getProjects: async (): Promise<Project[]> => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(loadMockData()), 500); // Simulate network delay
      });
    }
    const response = await fetch(`${API_BASE_URL}/projects/`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  // 2. CREATE PROJECT
  createProject: async (project: Project): Promise<Project> => {
    if (USE_MOCK_DATA) {
      const projects = loadMockData();
      projects.push(project);
      saveMockData(projects);
      return project;
    }
    const response = await fetch(`${API_BASE_URL}/projects/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return response.json();
  },

  // 3. DELETE PROJECT
  deleteProject: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      const projects = loadMockData().filter(p => p.id !== id);
      saveMockData(projects);
      return;
    }
    await fetch(`${API_BASE_URL}/projects/${id}/`, { method: 'DELETE' });
  },

  // 4. UPDATE INDICATOR (General)
  updateIndicator: async (projectId: string, indicator: Indicator): Promise<Indicator> => {
    if (USE_MOCK_DATA) {
      const projects = loadMockData();
      const projIndex = projects.findIndex(p => p.id === projectId);
      if (projIndex > -1) {
        const indIndex = projects[projIndex].indicators.findIndex(i => i.id === indicator.id);
        if (indIndex > -1) {
          projects[projIndex].indicators[indIndex] = indicator;
          saveMockData(projects);
        }
      }
      return indicator;
    }
    
    // In Django, we would typically PATCH /api/indicators/{id}/
    const response = await fetch(`${API_BASE_URL}/indicators/${indicator.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indicator),
    });
    return response.json();
  },

  // 5. QUICK LOG (Specific Action)
  quickLogIndicator: async (projectId: string, indicatorId: string): Promise<Indicator> => {
    const today = new Date().toISOString().split('T')[0];

    if (USE_MOCK_DATA) {
      const projects = loadMockData();
      const projIndex = projects.findIndex(p => p.id === projectId);
      let updatedInd: Indicator | null = null;
      
      if (projIndex > -1) {
        const indIndex = projects[projIndex].indicators.findIndex(i => i.id === indicatorId);
        if (indIndex > -1) {
          updatedInd = {
            ...projects[projIndex].indicators[indIndex],
            status: ComplianceStatus.COMPLIANT,
            lastUpdated: today
          };
          projects[projIndex].indicators[indIndex] = updatedInd;
          saveMockData(projects);
        }
      }
      return updatedInd!;
    }

    // Call custom action in Django
    const response = await fetch(`${API_BASE_URL}/indicators/${indicatorId}/quick_log/`, {
        method: 'POST'
    });
    return response.json();
  }
};
