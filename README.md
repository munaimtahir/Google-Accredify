<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# AccrediFy - AI-Powered Compliance Management Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.0.6-green)](https://www.djangoproject.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)](https://www.typescriptlang.org/)

A comprehensive compliance management platform that leverages AI to streamline compliance tracking, evidence management, and reporting across multiple regulatory standards.

</div>

## 🌟 Features

### Core Functionality
- 📊 **Multi-Project Management**: Manage multiple compliance projects simultaneously
- ✅ **Compliance Tracking**: Track compliance status across standards with visual dashboards
- 📈 **Advanced Analytics**: Real-time compliance metrics and progress tracking
- 📝 **Evidence Management**: Upload, organize, and link evidence to compliance indicators
- 📄 **Document Library**: Google Drive integration for centralized document storage
- 📋 **CSV Import/Export**: Bulk import compliance checklists via CSV

### AI-Powered Features
- 🤖 **AI Compliance Assistant**: Get instant answers about compliance requirements
- 🔍 **Smart Analysis**: Automatic categorization and analysis of compliance checklists
- 📖 **Compliance Guides**: AI-generated step-by-step compliance guides
- 🔄 **Auto-Fix Recommendations**: AI-powered suggestions for compliance gaps
- 📄 **Document Converter**: Convert PDF/DOCX documents to structured CSV format
- 🎯 **Task Analysis**: Identify actionable tasks from compliance requirements

### Reporting & Visualization
- 📊 **Interactive Dashboards**: Real-time compliance metrics with Recharts
- 📑 **PDF Reports**: Generate comprehensive compliance reports
- 🎨 **Visual Analytics**: Pie charts, bar charts, and progress indicators
- 📅 **Timeline Tracking**: Monitor compliance progress over time

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16.x or higher
- **Python** 3.9 or higher
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/munaimtahir/Google-Accredify.git
   cd Google-Accredify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** (optional, only if needed for VITE_API_URL)
   ```bash
   cp .env.example .env.local
   ```
   
   Note: `GEMINI_API_KEY` is only needed in the backend `.env` file. The frontend calls AI services through the backend API.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   GEMINI_API_KEY=your_api_key_here
   DJANGO_SECRET_KEY=your_secret_key_here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Start the Django development server**
   ```bash
   python manage.py runserver
   ```
   
   The API will be available at `http://localhost:8000`

## 📖 Documentation

**📑 [Complete Documentation Index](DOCUMENTATION_INDEX.md)** - Navigate all documentation

### Core Documentation
- **[Architecture Documentation](ARCHITECTURE.md)** - System design and component overview
- **[API Documentation](API.md)** - Complete API reference
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project
- **[Security Guide](SECURITY.md)** - Security best practices and policies
- **[Quick Start Guide](QUICK_START.md)** - Get started in minutes
- **[Review Summary](REVIEW_SUMMARY.md)** - Complete codebase assessment
- **[Code Quality Assessment](CODE_QUALITY_ASSESSMENT.md)** - Detailed code analysis
- **[Changelog](CHANGELOG.md)** - Version history and roadmap

## 🏗️ Project Structure

```
Google-Accredify/
├── components/              # React components
│   ├── Dashboard.tsx        # Main dashboard
│   ├── Checklist.tsx        # Compliance checklist
│   ├── AIAssistant.tsx      # AI chat interface
│   └── ...                  # Other components
├── services/                # API services
│   ├── api.ts              # REST API client
│   └── geminiService.ts    # Google Gemini integration
├── backend/                 # Django backend
│   ├── api/                # API endpoints
│   ├── accredify_backend/  # Django project settings
│   └── manage.py           # Django management script
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main application component
├── package.json            # Frontend dependencies
└── vite.config.ts          # Vite configuration
```

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - UI library
- **TypeScript 5.8.2** - Type-safe JavaScript
- **Vite 6.2.0** - Build tool and dev server
- **Recharts 2.12.7** - Data visualization
- **Lucide React** - Icon library
- **jsPDF** - PDF generation
- **PDF.js & Mammoth** - Document parsing

### Backend
- **Django 5.0.6** - Web framework
- **Django REST Framework 3.15.1** - API framework
- **Google Generative AI 0.7.1** - AI integration
- **Pillow 10.3.0** - Image processing
- **django-cors-headers** - CORS support

## 📊 Usage Guide

### Creating a Project

1. Click "Add New Project" on the Project Hub
2. Enter project name and description
3. (Optional) Upload a CSV file with compliance checklist
4. Click "Create Project"

### CSV Import Format

The CSV file should have the following columns:
```csv
Section,Standard,Indicator,Evidence Required,Responsible Person,Frequency,Assigned to,Compliance Evidence,Score
```

Example:
```csv
Data Protection,GDPR,Article 30,Records of processing activities,DPO,Annually,John Doe,Compliant,10
```

### Managing Compliance

1. **Update Status**: Click on any indicator to update its compliance status
2. **Add Evidence**: Click the evidence icon to upload documents, images, or add notes
3. **AI Guide**: Click "Get AI Guide" for step-by-step compliance instructions
4. **Quick Log**: Use the quick log button to mark tasks as completed

### AI Features

- **Ask Assistant**: Type questions about compliance in natural language
- **Auto-Analysis**: Automatically analyze imported checklists
- **Compliance Runner**: Run AI analysis across all indicators
- **Document Conversion**: Upload PDF/DOCX files to extract compliance requirements

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run backend server
cd backend && python manage.py runserver
```

### Adding New Components

1. Create component in `/components` directory
2. Import and use in `App.tsx` or parent component
3. Add TypeScript types in `types.ts` if needed
4. Update routing logic in `App.tsx`

### API Integration

All API calls are centralized in `services/api.ts`. To add a new endpoint:

```typescript
export const api = {
  // ... existing methods
  newEndpoint: async (params): Promise<ReturnType> => {
    const response = await fetch(`${API_BASE_URL}/endpoint/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed');
    return response.json();
  }
};
```

## 🚢 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Collect Django static files
cd backend && python manage.py collectstatic
```

### Environment Variables (Production)

```env
# Frontend (.env.production) - only if custom API URL needed
VITE_API_URL=https://api.yourdomain.com

# Backend (.env) or Docker Compose (.env/compose.env)
GEMINI_API_KEY=your_production_api_key
DJANGO_SECRET_KEY=strong_random_key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## 🔒 Security

- Environment variables for sensitive data
- CORS configuration for API access
- Input validation on frontend and backend
- File upload restrictions and validation
- Regular dependency updates

See [SECURITY.md](SECURITY.md) for security policies and reporting vulnerabilities.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of conduct
- Development setup
- Coding standards
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/munaimtahir/Google-Accredify/issues)
- **Documentation**: [Wiki](https://github.com/munaimtahir/Google-Accredify/wiki)
- **AI Studio**: [View in AI Studio](https://ai.studio/apps/drive/1hQfMmoTCZHIfw4UVlkEF-BInwBmQo9kS)

## 🙏 Acknowledgments

- Google Gemini AI for powering AI features
- React and Django communities
- All contributors to this project

## 📈 Roadmap

- [ ] Multi-language support (i18n)
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced workflow automation
- [ ] Integration with third-party compliance tools
- [ ] Custom report builder
- [ ] Role-based access control (RBAC)
- [ ] Audit trail and change history

---

<div align="center">
Made with ❤️ using React, Django, and Google Gemini AI
</div>
