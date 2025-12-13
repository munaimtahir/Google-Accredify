
import { Project, Indicator, Evidence, ComplianceStatus, Frequency, DriveConfig } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
  getProjects: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE_URL}/projects/`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  createProject: async (project: Project): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  deleteProject: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete project');
  },

  updateIndicator: async (projectId: string, indicator: Indicator): Promise<Indicator> => {
    // We strictly update fields, not evidence list directly via this call to avoid overwriting files
    // The backend serializer will handle nested read-only for evidence
    const response = await fetch(`${API_BASE_URL}/indicators/${indicator.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indicator),
    });
    if (!response.ok) throw new Error('Failed to update indicator');
    return response.json();
  },

  addEvidence: async (indicatorId: string, evidenceData: Omit<Evidence, 'id'>, file?: File): Promise<Evidence> => {
    const formData = new FormData();
    formData.append('indicator', indicatorId);
    formData.append('type', evidenceData.type);
    formData.append('file_name', evidenceData.fileName || 'Evidence');
    if (evidenceData.content) formData.append('content', evidenceData.content);
    if (evidenceData.fileUrl && !file) formData.append('file_url', evidenceData.fileUrl);
    
    if (file) {
        formData.append('file', file);
    }

    const response = await fetch(`${API_BASE_URL}/evidence/`, {
        method: 'POST',
        body: formData, // No Content-Type header; browser sets it with boundary
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to upload evidence: ${err}`);
    }
    return response.json();
  },

  quickLogIndicator: async (projectId: string, indicatorId: string): Promise<Indicator> => {
    const response = await fetch(`${API_BASE_URL}/indicators/${indicatorId}/quick_log/`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to quick log');
    return response.json();
  },

  connectGoogleDrive: async (projectId: string): Promise<DriveConfig> => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/connect-drive/`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to connect Drive');
    return response.json();
  },

  syncProjectToDrive: async (projectId: string): Promise<Project> => {
     const response = await fetch(`${API_BASE_URL}/projects/${projectId}/sync-drive/`, { method: 'POST' });
     if (!response.ok) throw new Error('Failed to sync Drive');
     return response.json();
  },

  // AI Services
  analyzeChecklist: async (indicators: Omit<Indicator, 'id' | 'evidence' | 'lastUpdated'>[]): Promise<Indicator[]> => {
    const response = await fetch(`${API_BASE_URL}/analyze-checklist/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indicators }),
    });
    if (!response.ok) throw new Error('Failed to analyze checklist');
    return response.json();
  },

  analyzeComplianceCategorization: async (indicators: Indicator[]): Promise<any> => {
      const response = await fetch(`${API_BASE_URL}/analyze-categorization/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicators }),
      });
      if (!response.ok) throw new Error('Failed to analyze categorization');
      return response.json();
  },

  askComplianceAssistant: async (query: string, indicators: Indicator[]): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/ask-assistant/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, indicators }),
    });
    if (!response.ok) throw new Error('Failed to query AI assistant');
    const data = await response.json();
    return data.response;
  },

  generateComplianceReportSummary: async (indicators: Indicator[]): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/report-summary/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indicators }),
    });
    if (!response.ok) throw new Error('Failed to generate summary');
    const data = await response.json();
    return data.summary;
  },

  generateCsvFromDocument: async (document_text: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/convert-document/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_text }),
    });
    if (!response.ok) throw new Error('Failed to convert document');
    const data = await response.json();
    return data.csv_content;
  },

  generateComplianceGuide: async (indicator: Indicator): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/compliance-guide/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator }),
    });
    if (!response.ok) throw new Error('Failed to generate guide');
    const data = await response.json();
    return data.guide;
  },

  analyzeChecklistForActionableTasks: async (indicators: Indicator[]): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/analyze-tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicators }),
    });
    if (!response.ok) throw new Error('Failed to analyze tasks');
    return response.json();
  }
};
