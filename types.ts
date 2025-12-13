
export enum ComplianceStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLIANT = 'Compliant',
  NON_COMPLIANT = 'Non-Compliant',
  NOT_APPLICABLE = 'Not Applicable'
}

export enum Frequency {
  ONE_TIME = 'One-time',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  ANNUALLY = 'Annually'
}

export interface Evidence {
  id: string;
  dateUploaded: string;
  type: 'document' | 'image' | 'certificate' | 'note' | 'link';
  fileName?: string; // For files & link text
  fileUrl?: string; // For files & link URL
  content?: string; // For notes
  // New Fields for Drive Integration
  driveFileId?: string;
  driveViewLink?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  fileSize?: string; 
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea';
    required?: boolean;
}

export interface Indicator {
  id: string;
  section: string; // From 'Section' column (formerly Area)
  standard: string; // From 'Standard' column (formerly Regulation/Standard)
  indicator: string; // From 'Indicator' column (formerly Requirement)
  description: string; // From 'Evidence Required' column
  score: number; // From 'Score' column, defaults to 10
  responsiblePerson?: string; // From 'Responsible Person' column
  frequency?: Frequency; // From 'Frequency' column
  assignee?: string; // From 'Assigned to' column
  status: ComplianceStatus; // From 'Status' column
  evidence: Evidence[];
  notes?: string;
  lastUpdated?: string; // ISO Date string (YYYY-MM-DD)
  formSchema?: FormField[];
  aiAnalysis?: {
    content: string;
    timestamp: string;
  };
}

export interface DriveConfig {
  isConnected: boolean;
  accountName?: string;
  rootFolderId?: string;
  lastSync?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  indicators: Indicator[];
  createdAt: string;
  driveConfig?: DriveConfig;
}

export interface StatMetric {
  label: string;
  value: number;
  color: string;
}
