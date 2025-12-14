# AI-Based Backend Development Plan

## Executive Summary

This document provides a comprehensive plan for an AI-based agent to develop a fully functional Django backend for the AccrediFy compliance management platform. The plan includes detailed specifications, architecture, implementation steps, testing strategy, and success criteria.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Backend Requirements](#backend-requirements)
4. [Architecture & Design](#architecture--design)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Testing Strategy](#testing-strategy)
7. [AI Agent Instructions](#ai-agent-instructions)
8. [Success Criteria](#success-criteria)
9. [Deliverables Checklist](#deliverables-checklist)

---

## Project Overview

### Application Purpose
AccrediFy is a compliance management platform that helps organizations track, manage, and report on compliance requirements across multiple standards and regulations.

### Technology Stack
- **Backend Framework:** Django 5.0.6
- **API Framework:** Django REST Framework 3.15.1
- **Database:** PostgreSQL (production), SQLite (development)
- **AI Integration:** Google Gemini AI 0.7.1
- **Additional Services:** Google Drive API (optional)

### Frontend API Contract
The frontend expects the following API endpoints (see `/services/api.ts`):
- Project management (CRUD)
- Indicator management (update, quick log)
- Evidence management (upload with files)
- Google Drive integration
- AI services (analysis, assistant, reports)

---

## Current State Analysis

### Existing Frontend
✅ **Fully functional frontend** with:
- 17 React/TypeScript components
- Complete UI for all features
- API client ready (`services/api.ts`)
- Type definitions (`types.ts`)
- 3,400+ lines of code

### Backend Status
🔴 **Critical Issues:**
- `backend/api/models.py` - Corrupted (binary data)
- `backend/api/views.py` - Corrupted (binary data)
- `backend/accredify_backend/settings.py` - Empty file
- No database models defined
- No API endpoints implemented
- No migrations created

✅ **Available:**
- `requirements.txt` with dependencies
- Django project structure exists
- Empty/placeholder files for:
  - `api/serializers.py`
  - `api/urls.py`
  - `api/services.py`
  - `api/ai_services.py`

---

## Backend Requirements

### Functional Requirements

#### 1. Data Models

**Project Model:**
```python
- id: UUID (primary key)
- name: CharField(max_length=200)
- description: TextField
- created_at: DateField(auto_now_add=True)
- indicators: Reverse relation to Indicator
- drive_config: OneToOneField to DriveConfig (optional)
```

**Indicator Model:**
```python
- id: CharField (primary key, e.g., "IND-123456")
- project: ForeignKey to Project
- section: CharField(max_length=200)
- standard: CharField(max_length=200)
- indicator: CharField(max_length=500)
- description: TextField
- score: IntegerField(default=10)
- responsible_person: CharField(max_length=200, optional)
- frequency: CharField(choices=Frequency)
- assignee: CharField(max_length=200, optional)
- status: CharField(choices=ComplianceStatus)
- notes: TextField(optional)
- last_updated: DateField(auto_now=True)
- form_schema: JSONField(optional)
- ai_analysis_content: TextField(optional)
- ai_analysis_timestamp: DateTimeField(optional)
```

**Evidence Model:**
```python
- id: UUID (primary key)
- indicator: ForeignKey to Indicator
- date_uploaded: DateTimeField(auto_now_add=True)
- type: CharField(choices=['document', 'image', 'certificate', 'note', 'link'])
- file_name: CharField(max_length=255)
- file: FileField(upload_to='evidence/', optional)
- file_url: URLField(optional)
- content: TextField(optional, for notes)
- drive_file_id: CharField(optional)
- drive_view_link: URLField(optional)
- sync_status: CharField(choices=['synced', 'pending', 'error'], default='pending')
- file_size: CharField(optional)
```

**DriveConfig Model:**
```python
- id: UUID (primary key)
- project: OneToOneField to Project
- is_connected: BooleanField(default=False)
- account_name: CharField(max_length=255, optional)
- root_folder_id: CharField(max_length=255, optional)
- last_sync: DateTimeField(optional)
```

#### 2. API Endpoints

**Project Endpoints:**
- `GET /api/projects/` - List all projects
- `POST /api/projects/` - Create project (with indicators)
- `DELETE /api/projects/{id}/` - Delete project
- `POST /api/projects/{id}/connect-drive/` - Connect Google Drive
- `POST /api/projects/{id}/sync-drive/` - Sync to Drive

**Indicator Endpoints:**
- `PATCH /api/indicators/{id}/` - Update indicator
- `POST /api/indicators/{id}/quick_log/` - Quick log (mark complete)

**Evidence Endpoints:**
- `POST /api/evidence/` - Upload evidence (multipart/form-data)

**AI Service Endpoints:**
- `POST /api/analyze-checklist/` - Analyze indicators with AI
- `POST /api/analyze-categorization/` - Categorize indicators
- `POST /api/ask-assistant/` - Query AI assistant
- `POST /api/report-summary/` - Generate report summary
- `POST /api/convert-document/` - Convert document to CSV
- `POST /api/compliance-guide/` - Generate compliance guide
- `POST /api/analyze-tasks/` - Analyze actionable tasks

#### 3. Non-Functional Requirements

**Security:**
- Input validation on all endpoints
- File upload size limits (10MB)
- File type validation
- CORS configuration
- SQL injection protection (via ORM)
- XSS protection

**Performance:**
- Database query optimization
- Efficient serialization
- Proper indexing
- Connection pooling

**Reliability:**
- Error handling
- Transaction management
- Logging
- Graceful degradation

---

## Architecture & Design

### Django Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── accredify_backend/          # Django project
│   ├── __init__.py
│   ├── settings.py            # ⚠️ TO CREATE
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── api/                        # Main app
    ├── __init__.py
    ├── models.py              # ⚠️ TO CREATE
    ├── views.py               # ⚠️ TO CREATE
    ├── serializers.py         # ⚠️ TO CREATE
    ├── urls.py                # ⚠️ TO CREATE
    ├── services.py            # ⚠️ TO CREATE (business logic)
    ├── ai_services.py         # ⚠️ TO CREATE (AI integration)
    ├── admin.py               # ⚠️ TO CREATE
    ├── apps.py
    ├── tests/                 # ⚠️ TO CREATE
    │   ├── __init__.py
    │   ├── test_models.py
    │   ├── test_views.py
    │   ├── test_serializers.py
    │   └── test_ai_services.py
    └── migrations/            # Auto-generated
```

### Design Patterns

1. **Repository Pattern:** Separate data access logic in `services.py`
2. **Service Layer:** Business logic in service classes
3. **Serializer Pattern:** DRF serializers for validation
4. **Dependency Injection:** AI services injected where needed

### Database Schema

```sql
-- Projects Table
CREATE TABLE api_project (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at DATE NOT NULL
);

-- Indicators Table
CREATE TABLE api_indicator (
    id VARCHAR(50) PRIMARY KEY,
    project_id UUID REFERENCES api_project(id) ON DELETE CASCADE,
    section VARCHAR(200) NOT NULL,
    standard VARCHAR(200) NOT NULL,
    indicator VARCHAR(500) NOT NULL,
    description TEXT,
    score INTEGER DEFAULT 10,
    responsible_person VARCHAR(200),
    frequency VARCHAR(20),
    assignee VARCHAR(200),
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    last_updated DATE,
    form_schema JSONB,
    ai_analysis_content TEXT,
    ai_analysis_timestamp TIMESTAMP
);

-- Evidence Table
CREATE TABLE api_evidence (
    id UUID PRIMARY KEY,
    indicator_id VARCHAR(50) REFERENCES api_indicator(id) ON DELETE CASCADE,
    date_uploaded TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255),
    file VARCHAR(255),
    file_url VARCHAR(500),
    content TEXT,
    drive_file_id VARCHAR(255),
    drive_view_link VARCHAR(500),
    sync_status VARCHAR(20) DEFAULT 'pending',
    file_size VARCHAR(50)
);

-- Drive Config Table
CREATE TABLE api_driveconfig (
    id UUID PRIMARY KEY,
    project_id UUID UNIQUE REFERENCES api_project(id) ON DELETE CASCADE,
    is_connected BOOLEAN DEFAULT FALSE,
    account_name VARCHAR(255),
    root_folder_id VARCHAR(255),
    last_sync TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_indicator_project ON api_indicator(project_id);
CREATE INDEX idx_indicator_status ON api_indicator(status);
CREATE INDEX idx_evidence_indicator ON api_evidence(indicator_id);
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

#### Step 1.1: Django Settings Configuration
**File:** `backend/accredify_backend/settings.py`

**Tasks:**
- Configure Django settings from scratch
- Set up database (SQLite for dev, PostgreSQL for production)
- Configure CORS for frontend (http://localhost:3000)
- Set up static/media file handling
- Configure REST Framework settings
- Add environment variable support

**Code Template:**
```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'accredify_backend.urls'

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# File uploads
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

#### Step 1.2: Create Data Models
**File:** `backend/api/models.py`

**Tasks:**
- Implement all models (Project, Indicator, Evidence, DriveConfig)
- Add proper field types and constraints
- Implement `__str__` methods
- Add Meta classes for ordering

**Implementation Notes:**
- Use UUID for Project and Evidence IDs
- Use custom string ID for Indicators (e.g., "IND-1234567890")
- Add proper indexes for performance
- Use JSONField for form_schema
- Add CASCADE delete for related objects

#### Step 1.3: Create Migrations
**Commands:**
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

**Validation:**
- Check migration files created
- Verify database schema
- Test model creation in Django shell

### Phase 2: API Layer (Week 1-2)

#### Step 2.1: Create Serializers
**File:** `backend/api/serializers.py`

**Tasks:**
- Create serializer for each model
- Handle nested serialization (Project → Indicators → Evidence)
- Add validation logic
- Implement create/update methods

**Key Serializers:**
```python
class EvidenceSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=False)
    
    class Meta:
        model = Evidence
        fields = '__all__'
        read_only_fields = ['id', 'date_uploaded']

class IndicatorSerializer(serializers.ModelSerializer):
    evidence = EvidenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Indicator
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    indicators = IndicatorSerializer(many=True, required=False)
    
    class Meta:
        model = Project
        fields = '__all__'
    
    def create(self, validated_data):
        indicators_data = validated_data.pop('indicators', [])
        project = Project.objects.create(**validated_data)
        
        for ind_data in indicators_data:
            Indicator.objects.create(project=project, **ind_data)
        
        return project
```

#### Step 2.2: Create ViewSets
**File:** `backend/api/views.py`

**Tasks:**
- Implement ProjectViewSet with all CRUD operations
- Implement IndicatorViewSet for updates
- Implement EvidenceViewSet for file uploads
- Add custom actions (@action decorator)
- Implement AI service views

**Key Views:**
```python
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().prefetch_related('indicators__evidence')
    serializer_class = ProjectSerializer
    
    @action(detail=True, methods=['post'])
    def connect_drive(self, request, pk=None):
        project = self.get_object()
        # Implementation
        return Response({'status': 'connected'})
    
    @action(detail=True, methods=['post'])
    def sync_drive(self, request, pk=None):
        project = self.get_object()
        # Implementation
        return Response(ProjectSerializer(project).data)

class IndicatorViewSet(viewsets.ModelViewSet):
    queryset = Indicator.objects.all()
    serializer_class = IndicatorSerializer
    http_method_names = ['get', 'patch']
    
    @action(detail=True, methods=['post'])
    def quick_log(self, request, pk=None):
        indicator = self.get_object()
        indicator.status = 'Compliant'
        indicator.save()
        return Response(IndicatorSerializer(indicator).data)

class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer
    http_method_names = ['post']
    parser_classes = [MultiPartParser, JSONParser]
```

#### Step 2.3: Configure URLs
**File:** `backend/api/urls.py`

**Tasks:**
- Register all viewsets with router
- Add custom endpoints
- Configure URL patterns

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet)
router.register(r'indicators', views.IndicatorViewSet)
router.register(r'evidence', views.EvidenceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('analyze-checklist/', views.analyze_checklist),
    path('analyze-categorization/', views.analyze_categorization),
    path('ask-assistant/', views.ask_assistant),
    path('report-summary/', views.report_summary),
    path('convert-document/', views.convert_document),
    path('compliance-guide/', views.compliance_guide),
    path('analyze-tasks/', views.analyze_tasks),
]
```

### Phase 3: AI Integration (Week 2)

#### Step 3.1: AI Service Implementation
**File:** `backend/api/ai_services.py`

**Tasks:**
- Implement Google Gemini AI integration
- Create service class for AI operations
- Handle API errors gracefully
- Implement caching for common queries

**Service Template:**
```python
import google.generativeai as genai
import os

class GeminiService:
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-pro')
    
    def analyze_checklist(self, indicators):
        """Analyze and enrich compliance checklist"""
        prompt = self._build_checklist_prompt(indicators)
        response = self.model.generate_content(prompt)
        return self._parse_checklist_response(response.text)
    
    def generate_compliance_guide(self, indicator):
        """Generate step-by-step compliance guide"""
        prompt = f"""Create a detailed compliance guide for:
        Standard: {indicator.standard}
        Requirement: {indicator.indicator}
        Description: {indicator.description}
        
        Provide step-by-step instructions, required evidence, and best practices."""
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def ask_assistant(self, query, indicators):
        """Answer compliance-related questions"""
        context = self._build_context(indicators)
        prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
        response = self.model.generate_content(prompt)
        return response.text
    
    # Additional methods...
```

#### Step 3.2: AI View Functions
**File:** `backend/api/views.py` (AI section)

**Tasks:**
- Create API views for each AI service
- Validate input data
- Handle AI service errors
- Return formatted responses

### Phase 4: Business Logic (Week 2)

#### Step 4.1: Service Layer
**File:** `backend/api/services.py`

**Tasks:**
- Implement business logic separate from views
- Create service classes for complex operations
- Handle file uploads
- Implement Google Drive integration stubs

**Service Classes:**
```python
class ProjectService:
    @staticmethod
    def create_project_with_indicators(data):
        """Create project with nested indicators"""
        # Implementation
        pass
    
    @staticmethod
    def delete_project_cascade(project_id):
        """Delete project and all related data"""
        # Implementation
        pass

class EvidenceService:
    @staticmethod
    def upload_evidence(indicator_id, file, metadata):
        """Handle evidence file upload"""
        # Validate file type and size
        # Save file
        # Create Evidence record
        pass
    
    @staticmethod
    def sync_to_drive(evidence_id):
        """Sync evidence to Google Drive"""
        # Implementation stub for future
        pass
```

### Phase 5: Testing (Week 3)

#### Step 5.1: Model Tests
**File:** `backend/api/tests/test_models.py`

**Test Coverage:**
- Test model creation
- Test field validation
- Test relationships (ForeignKey, OneToOne)
- Test cascade deletes
- Test `__str__` methods

**Example Tests:**
```python
from django.test import TestCase
from api.models import Project, Indicator, Evidence

class ProjectModelTest(TestCase):
    def test_create_project(self):
        project = Project.objects.create(
            name="Test Project",
            description="Test Description"
        )
        self.assertEqual(project.name, "Test Project")
        self.assertIsNotNone(project.id)
        self.assertIsNotNone(project.created_at)
    
    def test_project_str(self):
        project = Project.objects.create(name="Test")
        self.assertEqual(str(project), "Test")
    
    def test_cascade_delete(self):
        project = Project.objects.create(name="Test")
        indicator = Indicator.objects.create(
            project=project,
            section="Test Section",
            standard="Test Standard",
            indicator="Test Indicator",
            status="Not Started"
        )
        project_id = project.id
        project.delete()
        self.assertEqual(Indicator.objects.filter(project_id=project_id).count(), 0)
```

#### Step 5.2: Serializer Tests
**File:** `backend/api/tests/test_serializers.py`

**Test Coverage:**
- Test serialization (model → JSON)
- Test deserialization (JSON → model)
- Test validation errors
- Test nested serialization
- Test file upload handling

#### Step 5.3: API Tests
**File:** `backend/api/tests/test_views.py`

**Test Coverage:**
- Test all CRUD operations
- Test custom actions
- Test error responses
- Test authentication (when implemented)
- Test file uploads

**Example Tests:**
```python
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Project

class ProjectAPITest(APITestCase):
    def test_list_projects(self):
        Project.objects.create(name="Test1", description="Desc1")
        Project.objects.create(name="Test2", description="Desc2")
        
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_create_project(self):
        data = {
            'name': 'New Project',
            'description': 'New Description',
            'indicators': []
        }
        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 1)
    
    def test_delete_project(self):
        project = Project.objects.create(name="Test", description="Desc")
        response = self.client.delete(f'/api/projects/{project.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Project.objects.count(), 0)
```

#### Step 5.4: AI Service Tests
**File:** `backend/api/tests/test_ai_services.py`

**Test Coverage:**
- Test AI service initialization
- Test prompt building
- Test response parsing
- Mock Gemini API calls
- Test error handling

#### Step 5.5: Integration Tests
**File:** `backend/api/tests/test_integration.py`

**Test Coverage:**
- Test complete workflows
- Test frontend → backend integration
- Test file upload end-to-end
- Test AI service integration

**Target: 100% Test Coverage**
- Use `coverage.py` to measure
- Aim for 100% line coverage
- Cover all edge cases
- Test error conditions

---

## Testing Strategy

### Test Organization

```
backend/api/tests/
├── __init__.py
├── test_models.py          # Model tests (30+ tests)
├── test_serializers.py     # Serializer tests (25+ tests)
├── test_views.py           # API endpoint tests (40+ tests)
├── test_ai_services.py     # AI service tests (15+ tests)
├── test_integration.py     # Integration tests (20+ tests)
└── fixtures/               # Test data
    ├── projects.json
    ├── indicators.json
    └── sample_files/
```

### Test Execution

```bash
# Run all tests
python manage.py test

# Run with coverage
coverage run --source='api' manage.py test api
coverage report
coverage html  # Generate HTML report

# Run specific test file
python manage.py test api.tests.test_models

# Run specific test class
python manage.py test api.tests.test_models.ProjectModelTest

# Run specific test method
python manage.py test api.tests.test_models.ProjectModelTest.test_create_project
```

### Coverage Requirements

**Target Coverage: 100%**

- Models: 100% (all methods, properties)
- Serializers: 100% (all fields, validation)
- Views: 100% (all endpoints, error cases)
- Services: 100% (all business logic)
- AI Services: 95%+ (mock external APIs)

### Test Data

**Fixtures Required:**
- Sample projects (3-5)
- Sample indicators (20-30)
- Sample evidence files
- Edge case data

---

## AI Agent Instructions

### Agent Role
You are a senior Django backend developer tasked with building a production-ready REST API backend for the AccrediFy compliance management platform.

### Core Responsibilities

1. **Restore Backend Functionality**
   - Replace corrupted files with working code
   - Implement complete Django backend
   - Ensure 100% compatibility with frontend

2. **Implement All Features**
   - All API endpoints from frontend contract
   - All AI service integrations
   - File upload handling
   - Google Drive integration (stubs)

3. **Achieve 100% Test Coverage**
   - Write comprehensive tests
   - Cover all code paths
   - Test edge cases and errors

4. **Follow Best Practices**
   - Django conventions
   - DRF patterns
   - Security best practices
   - Clean code principles

### Step-by-Step Instructions

#### Phase 1: Setup (Day 1)

1. **Create settings.py**
   - Copy template from this document
   - Configure database
   - Set up CORS
   - Configure media files

2. **Create models.py**
   - Implement all 4 models
   - Add proper fields and constraints
   - Add Meta classes
   - Implement `__str__` methods

3. **Generate migrations**
   - Run `makemigrations`
   - Review migration files
   - Run `migrate`
   - Verify in database

4. **Test models**
   - Create test file
   - Write basic model tests
   - Run tests: `python manage.py test api.tests.test_models`

#### Phase 2: Serializers (Day 2)

1. **Create serializers.py**
   - Implement all serializers
   - Handle nested relationships
   - Add validation

2. **Test serializers**
   - Write serializer tests
   - Test validation
   - Test nested serialization

#### Phase 3: Views (Day 3-4)

1. **Create views.py**
   - Implement all viewsets
   - Add custom actions
   - Handle file uploads

2. **Create urls.py**
   - Register viewsets
   - Add custom endpoints

3. **Test API endpoints**
   - Write comprehensive API tests
   - Test all HTTP methods
   - Test error cases

#### Phase 4: AI Services (Day 5-6)

1. **Create ai_services.py**
   - Implement Gemini integration
   - Create all AI methods
   - Handle errors gracefully

2. **Create AI views**
   - Implement all AI endpoints
   - Connect to AI service

3. **Test AI services**
   - Write AI service tests
   - Mock external calls
   - Test error handling

#### Phase 5: Business Logic (Day 7)

1. **Create services.py**
   - Implement service classes
   - Extract complex logic from views
   - Add file handling

2. **Test services**
   - Write service tests
   - Test edge cases

#### Phase 6: Final Testing (Day 8-10)

1. **Integration tests**
   - Write end-to-end tests
   - Test complete workflows

2. **Coverage analysis**
   - Run coverage report
   - Identify gaps
   - Write missing tests
   - Achieve 100% coverage

3. **Manual testing**
   - Test with frontend
   - Verify all features work
   - Test file uploads
   - Test AI features

### Code Quality Requirements

1. **PEP 8 Compliance**
   - Use proper indentation
   - Follow naming conventions
   - Add docstrings

2. **Type Hints**
   - Add type hints to functions
   - Use Optional, List, Dict

3. **Error Handling**
   - Try-except blocks
   - Proper error messages
   - Log errors

4. **Documentation**
   - Docstrings for all classes/methods
   - Inline comments for complex logic
   - API documentation

### Validation Checklist

Before marking complete, verify:

- [ ] All 3 corrupted files replaced
- [ ] All models implemented
- [ ] All migrations created
- [ ] All serializers implemented
- [ ] All viewsets implemented
- [ ] All custom actions implemented
- [ ] All AI services implemented
- [ ] All URLs configured
- [ ] 100% test coverage achieved
- [ ] All tests passing
- [ ] Frontend integration works
- [ ] File uploads work
- [ ] AI features work
- [ ] No linting errors
- [ ] Code follows Django best practices
- [ ] Security best practices followed
- [ ] Documentation complete

---

## Success Criteria

### Functional Criteria

✅ **All API endpoints working:**
- GET /api/projects/ returns projects
- POST /api/projects/ creates project
- DELETE /api/projects/{id}/ deletes project
- PATCH /api/indicators/{id}/ updates indicator
- POST /api/indicators/{id}/quick_log/ logs completion
- POST /api/evidence/ uploads evidence
- All AI endpoints functional

✅ **Frontend integration:**
- Frontend can fetch projects
- Frontend can create projects
- Frontend can update indicators
- Frontend can upload evidence
- Frontend can use AI features
- No CORS errors
- No API errors

✅ **File handling:**
- Files upload successfully
- File size validated
- File type validated
- Files stored correctly
- File URLs accessible

✅ **AI integration:**
- Gemini AI configured
- All AI endpoints work
- Errors handled gracefully

### Quality Criteria

✅ **Test coverage: 100%**
- All models tested
- All serializers tested
- All views tested
- All services tested
- All AI services tested
- Integration tests pass

✅ **Code quality:**
- PEP 8 compliant
- No linting errors
- Proper documentation
- Type hints used
- Clean code principles

✅ **Security:**
- Input validation
- File upload security
- SQL injection protected
- XSS protected
- CSRF tokens configured

✅ **Performance:**
- Queries optimized
- Indexes added
- No N+1 queries
- Efficient serialization

---

## Deliverables Checklist

### Code Files

- [ ] `backend/accredify_backend/settings.py` (complete Django settings)
- [ ] `backend/api/models.py` (4 models: Project, Indicator, Evidence, DriveConfig)
- [ ] `backend/api/serializers.py` (4 serializers with nested handling)
- [ ] `backend/api/views.py` (3 viewsets + 7 AI views)
- [ ] `backend/api/urls.py` (complete URL configuration)
- [ ] `backend/api/services.py` (business logic layer)
- [ ] `backend/api/ai_services.py` (Gemini AI integration)
- [ ] `backend/api/admin.py` (Django admin configuration)

### Test Files

- [ ] `backend/api/tests/test_models.py` (30+ tests)
- [ ] `backend/api/tests/test_serializers.py` (25+ tests)
- [ ] `backend/api/tests/test_views.py` (40+ tests)
- [ ] `backend/api/tests/test_ai_services.py` (15+ tests)
- [ ] `backend/api/tests/test_integration.py` (20+ tests)

### Migrations

- [ ] Initial migration created
- [ ] All models in migration
- [ ] Migration successfully applied

### Documentation

- [ ] API endpoints documented
- [ ] Models documented (docstrings)
- [ ] Complex logic commented
- [ ] Test coverage report

### Validation

- [ ] All tests passing (130+ tests)
- [ ] 100% test coverage achieved
- [ ] No linting errors
- [ ] Frontend integration verified
- [ ] All features working

---

## Timeline

**Total Estimated Time: 10 days**

- **Week 1 (Days 1-5):** Core implementation
  - Day 1: Settings, models, migrations
  - Day 2: Serializers
  - Day 3-4: Views and URLs
  - Day 5: AI services

- **Week 2 (Days 6-10):** Testing and refinement
  - Day 6-7: Test writing
  - Day 8: Integration testing
  - Day 9: Coverage completion
  - Day 10: Final validation and documentation

---

## Troubleshooting Guide

### Common Issues

**Issue: Migrations fail**
- Solution: Check model definitions, ensure all imports correct

**Issue: CORS errors**
- Solution: Verify CORS_ALLOWED_ORIGINS in settings

**Issue: File uploads fail**
- Solution: Check MEDIA_ROOT, FILE_UPLOAD_MAX_MEMORY_SIZE settings

**Issue: AI services fail**
- Solution: Verify GEMINI_API_KEY in environment

**Issue: Tests fail**
- Solution: Check test database, verify test data

### Debug Commands

```bash
# Check Django configuration
python manage.py check

# Shell for debugging
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Run specific tests
python manage.py test api.tests.test_models -v 2

# Coverage report
coverage run --source='api' manage.py test api
coverage report -m
```

---

## References

### Django Documentation
- Models: https://docs.djangoproject.com/en/5.0/topics/db/models/
- Views: https://docs.djangoproject.com/en/5.0/topics/http/views/
- Testing: https://docs.djangoproject.com/en/5.0/topics/testing/

### DRF Documentation
- Serializers: https://www.django-rest-framework.org/api-guide/serializers/
- ViewSets: https://www.django-rest-framework.org/api-guide/viewsets/
- Testing: https://www.django-rest-framework.org/api-guide/testing/

### Project Documentation
- API Contract: `/services/api.ts`
- Type Definitions: `/types.ts`
- Architecture: `/ARCHITECTURE.md`
- API Docs: `/API.md`

---

**Last Updated:** January 2024  
**Version:** 1.0  
**Status:** Ready for AI Agent Implementation
