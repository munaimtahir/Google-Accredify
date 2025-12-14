# Architecture Documentation

## System Overview

AccrediFy is a comprehensive compliance management platform built with a modern tech stack consisting of a React/TypeScript frontend and a Django REST Framework backend. The application helps organizations manage, track, and analyze compliance requirements across multiple standards and regulations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   React 18 + TypeScript + Vite                       │   │
│  │   - Component-based UI                               │   │
│  │   - State management (useState, useEffect)           │   │
│  │   - Recharts for data visualization                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Django REST Framework                              │   │
│  │   - RESTful endpoints                                │   │
│  │   - Serializers for data validation                  │   │
│  │   - CORS support                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Django Models & Services                           │   │
│  │   - Data validation                                  │   │
│  │   - Business rules                                   │   │
│  │   - AI integration (Google Gemini)                   │   │
│  │   - Google Drive integration                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Google Gemini  │  │ Google Drive │  │  File Storage  │  │
│  │     AI API     │  │     API      │  │                │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **UI Components**: Custom components with Lucide React icons
- **Data Visualization**: Recharts 2.12.7
- **PDF Generation**: jsPDF 2.5.1 with jsPDF-AutoTable 3.8.2
- **Document Processing**: 
  - PDF.js 4.3.136 (PDF parsing)
  - Mammoth 1.7.2 (DOCX parsing)

### Backend
- **Framework**: Django 5.0.6
- **API**: Django REST Framework 3.15.1
- **CORS**: django-cors-headers 4.3.1
- **AI Integration**: google-generativeai 0.7.1
- **Image Processing**: Pillow 10.3.0
- **Environment**: python-dotenv 1.0.1

## Core Components

### Frontend Components

#### 1. Application Shell
- **App.tsx**: Main application component managing global state and routing
- **Sidebar.tsx**: Navigation component for switching between views

#### 2. Project Management
- **ProjectHub.tsx**: Dashboard for managing multiple compliance projects
- **AddProjectModal.tsx**: Modal for creating/editing projects
- **ManageIndicatorsModal.tsx**: Interface for managing compliance indicators

#### 3. Compliance Tracking
- **Dashboard.tsx**: Overview dashboard with charts and metrics
- **Checklist.tsx**: Detailed compliance checklist view
- **UpcomingTasks.tsx**: Task management and scheduling
- **Reports.tsx**: Compliance reporting and analytics

#### 4. AI Features
- **AIAssistant.tsx**: AI-powered compliance assistant
- **AIAnalysis.tsx**: AI-based analysis and recommendations
- **AIComplianceGuideModal.tsx**: AI-generated compliance guides
- **AIComplianceRunnerModal.tsx**: Automated compliance checking

#### 5. Document Management
- **DocumentLibrary.tsx**: Document storage and Google Drive integration
- **Converter.tsx**: Document to CSV conversion tool
- **EvidenceModal.tsx**: Evidence upload and management

#### 6. Form Management
- **ManageFormModal.tsx**: Dynamic form creation for compliance data collection

### Data Models

#### Project
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  indicators: Indicator[];
  createdAt: string;
  driveConfig?: DriveConfig;
}
```

#### Indicator
```typescript
interface Indicator {
  id: string;
  section: string;
  standard: string;
  indicator: string;
  description: string;
  score: number;
  responsiblePerson?: string;
  frequency?: Frequency;
  assignee?: string;
  status: ComplianceStatus;
  evidence: Evidence[];
  notes?: string;
  lastUpdated?: string;
  formSchema?: FormField[];
  aiAnalysis?: {
    content: string;
    timestamp: string;
  };
}
```

#### Evidence
```typescript
interface Evidence {
  id: string;
  dateUploaded: string;
  type: 'document' | 'image' | 'certificate' | 'note' | 'link';
  fileName?: string;
  fileUrl?: string;
  content?: string;
  driveFileId?: string;
  driveViewLink?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  fileSize?: string;
}
```

## Key Features

### 1. Multi-Project Management
- Create and manage multiple compliance projects
- Each project has its own set of indicators and evidence
- CSV import for bulk indicator creation

### 2. Compliance Tracking
- Track compliance status across multiple standards
- Visual dashboards with charts and metrics
- Section-based organization
- Scoring system for compliance measurement

### 3. AI Integration
- **Checklist Analysis**: Automatic analysis of imported compliance checklists
- **Compliance Assistant**: Ask questions about compliance requirements
- **Compliance Guide**: AI-generated step-by-step compliance guides
- **Auto-Fix**: AI-powered recommendations for compliance gaps
- **Document Conversion**: Convert PDF/DOCX documents to CSV format
- **Categorization**: Intelligent categorization of compliance items

### 4. Evidence Management
- Upload documents, images, certificates
- Add text notes and links
- Google Drive integration for cloud storage
- Evidence linked to specific indicators

### 5. Reporting
- Visual compliance reports
- PDF export functionality
- Section-based analysis
- Progress tracking over time

### 6. Dynamic Forms
- Create custom data collection forms for indicators
- Support for text, number, date, and textarea fields
- Form validation

## API Architecture

### REST API Endpoints

#### Project Management
- `GET /api/projects/` - List all projects
- `POST /api/projects/` - Create new project
- `DELETE /api/projects/{id}/` - Delete project
- `POST /api/projects/{id}/connect-drive/` - Connect Google Drive
- `POST /api/projects/{id}/sync-drive/` - Sync with Google Drive

#### Indicator Management
- `PATCH /api/indicators/{id}/` - Update indicator
- `POST /api/indicators/{id}/quick_log/` - Quick log compliance

#### Evidence Management
- `POST /api/evidence/` - Upload evidence (multipart/form-data)

#### AI Services
- `POST /api/analyze-checklist/` - Analyze compliance checklist
- `POST /api/analyze-categorization/` - Categorize indicators
- `POST /api/ask-assistant/` - Query AI assistant
- `POST /api/report-summary/` - Generate report summary
- `POST /api/convert-document/` - Convert document to CSV
- `POST /api/compliance-guide/` - Generate compliance guide
- `POST /api/analyze-tasks/` - Analyze actionable tasks

## State Management

The application uses React's built-in state management:
- **Local Component State**: `useState` for component-specific state
- **Side Effects**: `useEffect` for data fetching and synchronization
- **Prop Drilling**: Props passed through component hierarchy
- **Optimistic Updates**: UI updates before server confirmation for better UX

## Data Flow

### 1. Project Loading
```
User opens app → useEffect triggers → API.getProjects() → 
Update state → Render ProjectHub
```

### 2. Indicator Update
```
User updates indicator → Optimistic UI update → 
API.updateIndicator() → Confirm/Rollback on error
```

### 3. Evidence Upload
```
User selects file → API.addEvidence(file) → 
Backend processes → Returns evidence with URL → 
Update state → UI refreshes
```

### 4. AI Analysis
```
User requests analysis → API.analyzeChecklist(indicators) → 
Google Gemini processes → Returns enriched data → 
Update indicators → Show results
```

## Security Considerations

### Current Implementation
1. **API Key Management**: Environment variables for API keys
2. **CORS Configuration**: Configured in Django for cross-origin requests
3. **File Upload**: Multipart form data handling

### Recommendations for Production
1. **Authentication**: Implement JWT or OAuth2
2. **Authorization**: Role-based access control
3. **Input Validation**: Comprehensive validation on both client and server
4. **Rate Limiting**: Protect AI endpoints from abuse
5. **File Upload Security**: 
   - File type validation
   - Size limits
   - Virus scanning
   - Secure storage
6. **HTTPS**: Enforce SSL/TLS in production
7. **API Key Rotation**: Regular rotation of API keys
8. **Content Security Policy**: Implement CSP headers
9. **SQL Injection Protection**: Django ORM provides protection
10. **XSS Protection**: React's default escaping + additional sanitization

## Scalability Considerations

### Current Architecture
- Single-server deployment
- In-memory state management
- Synchronous API calls

### Future Improvements
1. **Database**: Add PostgreSQL for data persistence
2. **Caching**: Implement Redis for session and API caching
3. **File Storage**: Move to cloud storage (S3, GCS)
4. **Background Jobs**: Celery for async AI processing
5. **Load Balancing**: Multi-instance deployment
6. **CDN**: Static asset delivery
7. **Microservices**: Separate AI service from main API
8. **Horizontal Scaling**: Container orchestration (Kubernetes)

## Development Workflow

### Local Development
1. Frontend runs on port 3000 (Vite dev server)
2. Backend runs on port 8000 (Django dev server)
3. Hot reload enabled for both
4. CORS allows local cross-origin requests

### Build Process
1. **Frontend**: `npm run build` → Vite creates optimized bundle in `/dist`
2. **Backend**: Django serves API directly
3. **Static Assets**: Can be served by Django in production

## Integration Points

### Google Gemini AI
- API Key required: `GEMINI_API_KEY`
- Used for all AI features
- Rate limits apply based on API tier

### Google Drive
- OAuth integration for file storage
- Bidirectional sync capability
- Folder structure mirrors project organization

## Error Handling

### Frontend
- Try-catch blocks for async operations
- Error logging to console
- User-friendly error messages
- Optimistic updates with rollback

### Backend
- Django REST Framework error responses
- Validation errors with detailed messages
- HTTP status codes for different error types
- Exception handling in AI services

## Performance Optimization

### Frontend
1. Component-level code splitting
2. Lazy loading for modals
3. Memoization for expensive calculations
4. Virtual scrolling for large lists (recommended)

### Backend
1. Database query optimization
2. API response caching
3. Pagination for large datasets
4. Async processing for AI tasks

## Deployment Architecture

### Recommended Production Setup

```
┌─────────────────────────────────────────┐
│           Load Balancer (Nginx)         │
│                                         │
│  - SSL Termination                      │
│  - Static File Serving                  │
│  - Request Routing                      │
└─────────────────────────────────────────┘
              ↓
    ┌─────────────────┐
    │   React App     │
    │  (Static Files) │
    └─────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        Django Application Server        │
│                                         │
│  - Gunicorn/uWSGI                       │
│  - Multiple Workers                     │
│  - API Endpoints                        │
└─────────────────────────────────────────┘
              ↓
    ┌─────────────────┐
    │   PostgreSQL    │
    │    Database     │
    └─────────────────┘
```

## Testing Strategy

### Current State
- No automated tests implemented

### Recommended Testing Approach
1. **Frontend**:
   - Unit tests: Jest + React Testing Library
   - Component tests: Test user interactions
   - E2E tests: Playwright or Cypress
   
2. **Backend**:
   - Unit tests: Django TestCase
   - API tests: Django REST Framework APITestCase
   - Integration tests: Test AI integrations with mocks

3. **Coverage Goals**:
   - Critical paths: 90%+
   - Overall: 70%+

## Monitoring and Observability

### Recommendations
1. **Application Monitoring**: Sentry for error tracking
2. **Performance Monitoring**: Application performance metrics
3. **Logging**: Structured logging (JSON format)
4. **Metrics**: Prometheus + Grafana
5. **Uptime Monitoring**: Health check endpoints
6. **User Analytics**: Usage patterns and feature adoption

## Compliance and Standards

The application is designed to support multiple compliance frameworks:
- ISO Standards
- Regulatory Requirements
- Industry-specific Standards
- Custom Compliance Frameworks

## Future Enhancements

1. **Real-time Collaboration**: WebSocket support for multi-user editing
2. **Mobile App**: React Native or PWA
3. **Offline Support**: Service workers and local storage
4. **Advanced Analytics**: Machine learning for compliance predictions
5. **Audit Trail**: Complete change history
6. **Workflow Automation**: Automated compliance workflows
7. **Integration Hub**: Connect with other compliance tools
8. **Custom Dashboards**: User-configurable dashboards
9. **Multi-language Support**: Internationalization (i18n)
10. **Advanced Reporting**: Custom report builder
