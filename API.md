# API Documentation

## Base URL

```
Development: http://127.0.0.1:8000/api
Production: https://your-domain.com/api
```

## Authentication

Currently, the API does not require authentication. For production deployment, implement one of the following:
- JWT (JSON Web Tokens)
- OAuth2
- Session-based authentication

## Content Types

- Request: `application/json` (except file uploads)
- Response: `application/json`
- File Upload: `multipart/form-data`

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description",
  "details": {
    "field": ["Specific field error"]
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Successful request with no response body
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Project Management

### List Projects

Get all compliance projects.

**Endpoint:** `GET /api/projects/`

**Response:**
```json
[
  {
    "id": "uuid-string",
    "name": "GDPR Compliance Project",
    "description": "Company-wide GDPR compliance initiative",
    "createdAt": "2024-01-15",
    "indicators": [...],
    "driveConfig": {
      "isConnected": true,
      "accountName": "user@example.com",
      "rootFolderId": "drive-folder-id",
      "lastSync": "2024-01-20T10:30:00Z"
    }
  }
]
```

### Create Project

Create a new compliance project.

**Endpoint:** `POST /api/projects/`

**Request Body:**
```json
{
  "name": "ISO 27001 Compliance",
  "description": "Information security management system compliance",
  "indicators": [
    {
      "section": "Information Security",
      "standard": "ISO 27001",
      "indicator": "A.5.1.1 Policies for information security",
      "description": "Document and approve information security policies",
      "score": 10,
      "responsiblePerson": "John Doe",
      "frequency": "Annually",
      "assignee": "Security Team",
      "status": "Not Started",
      "evidence": []
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "newly-created-uuid",
  "name": "ISO 27001 Compliance",
  "description": "Information security management system compliance",
  "createdAt": "2024-01-20",
  "indicators": [...]
}
```

### Delete Project

Delete a compliance project and all associated data.

**Endpoint:** `DELETE /api/projects/{id}/`

**Response:** `204 No Content`

---

## Indicator Management

### Update Indicator

Update an existing compliance indicator.

**Endpoint:** `PATCH /api/indicators/{id}/`

**Request Body:**
```json
{
  "status": "Compliant",
  "notes": "Completed policy review and approval",
  "lastUpdated": "2024-01-20",
  "assignee": "Jane Smith"
}
```

**Response:** `200 OK`
```json
{
  "id": "indicator-id",
  "section": "Information Security",
  "standard": "ISO 27001",
  "indicator": "A.5.1.1 Policies for information security",
  "status": "Compliant",
  "notes": "Completed policy review and approval",
  "lastUpdated": "2024-01-20",
  "evidence": [...]
}
```

### Quick Log Indicator

Mark an indicator as completed with automatic timestamp.

**Endpoint:** `POST /api/indicators/{id}/quick_log/`

**Request Body:** None

**Response:** `200 OK`
```json
{
  "id": "indicator-id",
  "status": "Compliant",
  "lastUpdated": "2024-01-20"
}
```

---

## Evidence Management

### Add Evidence

Upload evidence for a compliance indicator.

**Endpoint:** `POST /api/evidence/`

**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `indicator` (required): Indicator ID
- `type` (required): One of: `document`, `image`, `certificate`, `note`, `link`
- `file_name` (required): Display name for the evidence
- `file` (optional): File to upload (for document, image, certificate types)
- `content` (optional): Text content (for note type)
- `file_url` (optional): URL (for link type)

**Example - Document Upload:**
```
POST /api/evidence/
Content-Type: multipart/form-data

indicator: "indicator-uuid"
type: "document"
file_name: "Security Policy v2.0"
file: [binary file data]
```

**Example - Note:**
```
POST /api/evidence/
Content-Type: multipart/form-data

indicator: "indicator-uuid"
type: "note"
file_name: "Policy Review Notes"
content: "Reviewed and approved by security committee on 2024-01-15"
```

**Response:** `201 Created`
```json
{
  "id": "evidence-uuid",
  "dateUploaded": "2024-01-20T14:30:00Z",
  "type": "document",
  "fileName": "Security Policy v2.0",
  "fileUrl": "https://storage.example.com/files/evidence-uuid.pdf",
  "fileSize": "245 KB",
  "syncStatus": "pending"
}
```

---

## Google Drive Integration

### Connect Google Drive

Connect a project to Google Drive for document storage.

**Endpoint:** `POST /api/projects/{id}/connect-drive/`

**Request Body:** None (OAuth flow handled separately)

**Response:** `200 OK`
```json
{
  "isConnected": true,
  "accountName": "user@example.com",
  "rootFolderId": "drive-folder-id",
  "lastSync": "2024-01-20T10:30:00Z"
}
```

### Sync to Google Drive

Synchronize project documents with Google Drive.

**Endpoint:** `POST /api/projects/{id}/sync-drive/`

**Request Body:** None

**Response:** `200 OK`
```json
{
  "id": "project-id",
  "name": "GDPR Compliance Project",
  "driveConfig": {
    "isConnected": true,
    "lastSync": "2024-01-20T15:45:00Z"
  },
  "indicators": [
    {
      "evidence": [
        {
          "id": "evidence-id",
          "driveFileId": "google-drive-file-id",
          "driveViewLink": "https://drive.google.com/file/d/...",
          "syncStatus": "synced"
        }
      ]
    }
  ]
}
```

---

## AI Services

### Analyze Checklist

Analyze and enrich a compliance checklist using AI.

**Endpoint:** `POST /api/analyze-checklist/`

**Request Body:**
```json
{
  "indicators": [
    {
      "section": "Data Protection",
      "standard": "GDPR",
      "indicator": "Article 30",
      "description": "Records of processing activities",
      "score": 10,
      "frequency": "Annually",
      "status": "Not Started"
    }
  ]
}
```

**Response:** `200 OK`
```json
[
  {
    "id": "generated-uuid",
    "section": "Data Protection",
    "standard": "GDPR",
    "indicator": "Article 30",
    "description": "Records of processing activities",
    "score": 10,
    "frequency": "Annually",
    "status": "Not Started",
    "evidence": [],
    "aiAnalysis": {
      "content": "This requirement mandates maintaining detailed records of all data processing activities...",
      "timestamp": "2024-01-20T10:00:00Z"
    }
  }
]
```

### Analyze Categorization

Analyze and categorize compliance indicators.

**Endpoint:** `POST /api/analyze-categorization/`

**Request Body:**
```json
{
  "indicators": [...]
}
```

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "name": "High Priority",
      "count": 15,
      "indicators": ["id1", "id2", ...]
    },
    {
      "name": "Medium Priority",
      "count": 23,
      "indicators": ["id3", "id4", ...]
    }
  ],
  "recommendations": [
    "Focus on completing high-priority items first",
    "Consider allocating additional resources to data protection section"
  ]
}
```

### Ask Compliance Assistant

Query the AI assistant about compliance requirements.

**Endpoint:** `POST /api/ask-assistant/`

**Request Body:**
```json
{
  "query": "What documentation is required for GDPR Article 30?",
  "indicators": [...]
}
```

**Response:** `200 OK`
```json
{
  "response": "GDPR Article 30 requires organizations to maintain records of processing activities, including:\n1. Name and contact details of the controller\n2. Purposes of the processing\n3. Description of categories of data subjects and personal data\n4. Categories of recipients..."
}
```

### Generate Report Summary

Generate an AI-powered compliance report summary.

**Endpoint:** `POST /api/report-summary/`

**Request Body:**
```json
{
  "indicators": [...]
}
```

**Response:** `200 OK`
```json
{
  "summary": "Overall compliance stands at 67% with 45 out of 67 requirements completed. Key areas requiring attention include data retention policies (3 items pending) and security incident response procedures (5 items pending). Strong performance observed in access control and encryption requirements."
}
```

### Convert Document to CSV

Convert a document (PDF/DOCX) to compliance checklist CSV format.

**Endpoint:** `POST /api/convert-document/`

**Request Body:**
```json
{
  "document_text": "Full text content of the document..."
}
```

**Response:** `200 OK`
```json
{
  "csv_content": "Section,Standard,Indicator,Evidence Required,Responsible Person,Frequency,Assigned to,Compliance Evidence,Score\nData Protection,GDPR,Article 30,Records of processing,DPO,Annually,John Doe,Not Started,10\n..."
}
```

### Generate Compliance Guide

Generate a step-by-step compliance guide for an indicator.

**Endpoint:** `POST /api/compliance-guide/`

**Request Body:**
```json
{
  "indicator": {
    "section": "Data Protection",
    "standard": "GDPR",
    "indicator": "Article 30",
    "description": "Records of processing activities"
  }
}
```

**Response:** `200 OK`
```json
{
  "guide": "# Step-by-Step Guide for GDPR Article 30\n\n## Overview\nArticle 30 requires maintaining records of processing activities...\n\n## Step 1: Identify Processing Activities\n- List all data processing operations\n- Document the purpose of each activity\n\n## Step 2: Document Required Information\n- Controller/processor details\n- Categories of data subjects\n- Categories of personal data\n\n## Step 3: Maintain Records\n- Create a central register\n- Update regularly\n- Make available to supervisory authority\n\n## Evidence to Collect\n- Processing activity register\n- Data flow diagrams\n- Privacy notices\n\n## Best Practices\n- Review and update quarterly\n- Involve data protection officer\n- Use standardized templates"
}
```

### Analyze Actionable Tasks

Analyze indicators to identify actionable tasks.

**Endpoint:** `POST /api/analyze-tasks/`

**Request Body:**
```json
{
  "indicators": [...]
}
```

**Response:** `200 OK`
```json
[
  {
    "indicatorId": "indicator-uuid",
    "taskName": "Create Data Processing Register",
    "priority": "High",
    "estimatedEffort": "4 hours",
    "dependencies": [],
    "suggestedAssignee": "Data Protection Officer",
    "deadline": "2024-02-15"
  },
  {
    "indicatorId": "indicator-uuid-2",
    "taskName": "Review Privacy Notices",
    "priority": "Medium",
    "estimatedEffort": "2 hours",
    "dependencies": ["Create Data Processing Register"],
    "suggestedAssignee": "Legal Team",
    "deadline": "2024-02-20"
  }
]
```

---

## Data Models

### ComplianceStatus Enum
- `Not Started`
- `In Progress`
- `Compliant`
- `Non-Compliant`
- `Not Applicable`

### Frequency Enum
- `One-time`
- `Daily`
- `Weekly`
- `Monthly`
- `Quarterly`
- `Annually`

### Evidence Type Enum
- `document` - File upload (PDF, DOCX, etc.)
- `image` - Image file
- `certificate` - Certificate file
- `note` - Text note
- `link` - External URL

### Sync Status Enum
- `synced` - Successfully synced to Google Drive
- `pending` - Sync in progress
- `error` - Sync failed

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended for Production:**
- 100 requests per minute per IP for general endpoints
- 10 requests per minute per IP for AI endpoints
- 50 requests per minute per IP for file uploads

---

## Pagination

For large datasets, implement pagination:

**Request Parameters:**
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "count": 250,
  "next": "http://api.example.com/api/projects/?page=3",
  "previous": "http://api.example.com/api/projects/?page=1",
  "results": [...]
}
```

---

## Webhooks (Future Feature)

Subscribe to events:
- `project.created`
- `project.updated`
- `project.deleted`
- `indicator.status_changed`
- `evidence.uploaded`
- `drive.synced`

---

## Best Practices

### API Usage
1. Always check HTTP status codes
2. Handle errors gracefully
3. Implement retry logic with exponential backoff
4. Cache responses when appropriate
5. Use HTTPS in production

### File Uploads
1. Validate file types on client side
2. Limit file size (recommended: 10MB max)
3. Use unique filenames
4. Scan for viruses in production

### AI Endpoints
1. Implement request throttling
2. Show loading indicators to users
3. Handle timeouts gracefully
4. Cache AI responses when possible
5. Provide fallback content

---

## Example Integration

### JavaScript/TypeScript

```typescript
const API_BASE_URL = 'http://localhost:8000/api';

// Fetch projects
async function getProjects() {
  const response = await fetch(`${API_BASE_URL}/projects/`);
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return await response.json();
}

// Create project
async function createProject(data) {
  const response = await fetch(`${API_BASE_URL}/projects/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return await response.json();
}

// Upload evidence
async function uploadEvidence(indicatorId, file) {
  const formData = new FormData();
  formData.append('indicator', indicatorId);
  formData.append('type', 'document');
  formData.append('file_name', file.name);
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/evidence/`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to upload evidence');
  }
  return await response.json();
}

// Ask AI assistant
async function askAssistant(query, indicators) {
  const response = await fetch(`${API_BASE_URL}/ask-assistant/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, indicators }),
  });
  if (!response.ok) {
    throw new Error('Failed to query assistant');
  }
  const data = await response.json();
  return data.response;
}
```

### Python

```python
import requests

API_BASE_URL = 'http://localhost:8000/api'

# Fetch projects
def get_projects():
    response = requests.get(f'{API_BASE_URL}/projects/')
    response.raise_for_status()
    return response.json()

# Create project
def create_project(data):
    response = requests.post(
        f'{API_BASE_URL}/projects/',
        json=data
    )
    response.raise_for_status()
    return response.json()

# Upload evidence
def upload_evidence(indicator_id, file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'indicator': indicator_id,
            'type': 'document',
            'file_name': os.path.basename(file_path)
        }
        response = requests.post(
            f'{API_BASE_URL}/evidence/',
            data=data,
            files=files
        )
        response.raise_for_status()
        return response.json()

# Ask AI assistant
def ask_assistant(query, indicators):
    response = requests.post(
        f'{API_BASE_URL}/ask-assistant/',
        json={'query': query, 'indicators': indicators}
    )
    response.raise_for_status()
    return response.json()['response']
```

---

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Project management endpoints
- Indicator tracking
- Evidence upload
- Google Drive integration
- AI services integration

### Planned Updates
- Authentication and authorization
- Rate limiting
- Pagination
- Webhook support
- API versioning
- GraphQL endpoint
