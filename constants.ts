

import { ComplianceStatus, Project, Frequency, Indicator } from './types';

const PHC_INDICATORS: Indicator[] = [
  {
    id: 'IND-001',
    section: 'Infrastructure',
    standard: 'Patient & Staff Facilities',
    indicator: 'Separate Waiting Area',
    description: 'The laboratory must have a designated waiting area for patients, separate from the sample collection and testing areas to prevent cross-contamination.',
    score: 10,
    responsiblePerson: 'Facility Manager',
    frequency: Frequency.ONE_TIME,
    assignee: 'Dr. Sarah Smith',
    status: ComplianceStatus.COMPLIANT,
    evidence: [],
    lastUpdated: '2023-10-01',
  },
  {
    id: 'IND-002',
    section: 'Infrastructure',
    standard: 'Environmental Control',
    indicator: 'Temperature Log (Fridge)',
    description: 'Daily temperature logs for reagent refrigerators must be maintained between 2-8°C.',
    score: 15,
    responsiblePerson: 'Lab Technician',
    frequency: Frequency.DAILY,
    assignee: 'Jane Doe',
    status: ComplianceStatus.IN_PROGRESS,
    evidence: [],
    lastUpdated: '2023-10-26', // Intentionally old to show as overdue
  },
  {
    id: 'IND-003',
    section: 'Safety',
    standard: 'Emergency Preparedness',
    indicator: 'Eye Wash Station Check',
    description: 'Weekly functional check of the eye wash station to ensure water flow and clarity.',
    score: 20,
    responsiblePerson: 'Safety Officer',
    frequency: Frequency.WEEKLY,
    assignee: 'Safety Officer',
    status: ComplianceStatus.COMPLIANT,
    evidence: [],
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week ago
  },
  {
    id: 'IND-004',
    section: 'MSDS Documentation',
    standard: 'Chemical Safety Sheets',
    indicator: 'Formalin MSDS Availability',
    description: 'Current Material Safety Data Sheet (MSDS) for Formaldehyde must be physically available and accessible to all staff members.',
    score: 10,
    responsiblePerson: 'Lab Director',
    frequency: Frequency.ANNUALLY,
    assignee: 'Lab Tech Lead',
    status: ComplianceStatus.NON_COMPLIANT,
    evidence: [],
  },
  {
    id: 'IND-005',
    section: 'Quality Control',
    standard: 'Equipment Maintenance',
    indicator: 'Microscope Cleaning Log',
    description: 'Daily cleaning of microscope objectives with lens paper and cleaner.',
    score: 10,
    responsiblePerson: 'Senior Technologist',
    frequency: Frequency.DAILY,
    status: ComplianceStatus.COMPLIANT,
    evidence: [],
    lastUpdated: new Date().toISOString().split('T')[0], // Done today
  },
  {
    id: 'IND-006',
    section: 'Waste Management',
    standard: 'Biohazard Disposal',
    indicator: 'Waste Disposal Log',
    description: 'Weekly handover of biohazard waste to the licensed contractor must be logged.',
    score: 5,
    responsiblePerson: 'Safety Officer',
    frequency: Frequency.WEEKLY,
    assignee: 'Cleaning Supervisor',
    status: ComplianceStatus.COMPLIANT,
    evidence: [
        {
            id: 'ev-1',
            fileName: 'bin_photo_lab_a.jpg',
            fileUrl: '#',
            dateUploaded: '2023-10-25',
            type: 'image'
        }
    ],
    lastUpdated: '2023-10-20',
    formSchema: [
      { name: 'date_of_disposal', label: 'Date of Disposal', type: 'date', required: true },
      { name: 'waste_type', label: 'Waste Type (e.g., Sharps, Biohazard)', type: 'text', required: true },
      { name: 'weight_kg', label: 'Weight (kg)', type: 'number', required: true },
      { name: 'contractor_name', label: 'Contractor Name', type: 'text' },
      { name: 'notes', label: 'Notes / Observations', type: 'textarea' }
    ]
  },
  {
    id: 'IND-007',
    section: 'Quality Control',
    standard: 'Internal QC',
    indicator: 'Controls Verification',
    description: 'Run positive and negative controls for all qualitative tests daily.',
    score: 20,
    responsiblePerson: 'Lab Manager',
    frequency: Frequency.DAILY,
    status: ComplianceStatus.NOT_STARTED,
    evidence: [],
  },
  {
    id: 'IND-008',
    section: 'Inventory',
    standard: 'Reagent Management',
    indicator: 'Reagent Expiry Check',
    description: 'Monthly audit of all reagents to remove expired stock.',
    score: 15,
    responsiblePerson: 'Store Manager',
    frequency: Frequency.MONTHLY,
    status: ComplianceStatus.IN_PROGRESS,
    evidence: [],
    lastUpdated: '2023-09-15',
  }
];

const PMDC_INDICATORS: Indicator[] = [
  {
    id: 'PMDC-IND-001',
    section: 'Staffing',
    standard: 'Faculty-Trainee Ratio',
    indicator: 'Faculty Ratio 1:3',
    description: 'Post-graduate training programs must maintain a supervisor to trainee ratio of 1:3.',
    score: 25,
    responsiblePerson: 'Dean of Medicine',
    frequency: Frequency.ANNUALLY,
    status: ComplianceStatus.NON_COMPLIANT,
    evidence: [],
  },
  {
    id: 'PMDC-IND-002',
    section: 'Infrastructure',
    standard: 'Educational Resources',
    indicator: 'Digital Library Access',
    description: 'Trainees must have 24/7 access to HEC digital library resources.',
    score: 10,
    responsiblePerson: 'IT Director',
    frequency: Frequency.ONE_TIME,
    status: ComplianceStatus.COMPLIANT,
    evidence: [],
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'PHC Laboratory Licensing',
    description: 'Standard checklist for Provincial Health Commission Laboratory licensing and MSDS compliance.',
    indicators: PHC_INDICATORS,
    createdAt: '2023-01-01'
  },
  {
    id: 'proj_2',
    name: 'PMDC PG Regulations',
    description: 'Compliance tracker for Post-Graduate Medical Education standards.',
    indicators: PMDC_INDICATORS,
    createdAt: '2023-05-15'
  }
];

export const SECTION_COLORS: Record<string, string> = {
  'Infrastructure': '#3b82f6', // blue-500
  'Staffing': '#8b5cf6', // violet-500
  'Equipment': '#f59e0b', // amber-500
  'Safety': '#ef4444', // red-500
  'Biosafety': '#10b981', // emerald-500
  'Waste Management': '#6366f1', // indigo-500
  'MSDS Documentation': '#ec4899', // pink-500
  'Operational': '#0d9488', // teal-600
  'Quality Control': '#f43f5e', // rose-500
  'Inventory': '#84cc16', // lime-500
  'General': '#64748b', // slate-500
};