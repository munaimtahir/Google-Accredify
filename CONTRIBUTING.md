# Contributing to AccrediFy

Thank you for your interest in contributing to AccrediFy! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)
8. [Project Structure](#project-structure)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discriminatory comments, or personal attacks
- Publishing others' private information without permission
- Trolling, insulting/derogatory comments
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Python 3.9 or higher
- Git
- A code editor (VS Code recommended)
- Google Gemini API key for testing AI features

### First Contribution

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/Google-Accredify.git
   cd Google-Accredify
   ```
3. **Set up the upstream remote**
   ```bash
   git remote add upstream https://github.com/munaimtahir/Google-Accredify.git
   ```
4. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Gemini API key to .env.local
echo "GEMINI_API_KEY=your_api_key_here" >> .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Configure .env with your settings
# DATABASE_URL, DJANGO_SECRET_KEY, GEMINI_API_KEY, etc.

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

The API will be available at `http://localhost:8000`

---

## Coding Standards

### TypeScript/React

#### Code Style

- Use **TypeScript** for all new components
- Use **functional components** with hooks
- Follow **React best practices**
- Use **meaningful variable and function names**
- Add **JSDoc comments** for complex functions

#### Example:

```typescript
/**
 * Calculate overall compliance percentage
 * @param indicators - Array of compliance indicators
 * @returns Compliance percentage (0-100)
 */
const calculateCompliance = (indicators: Indicator[]): number => {
  const compliant = indicators.filter(i => i.status === ComplianceStatus.COMPLIANT);
  return Math.round((compliant.length / indicators.length) * 100);
};
```

#### Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { SomeType } from '../types';

interface ComponentProps {
  prop1: string;
  prop2: number;
  onAction?: () => void;
}

const MyComponent: React.FC<ComponentProps> = ({ prop1, prop2, onAction }) => {
  const [state, setState] = useState<SomeType | null>(null);

  useEffect(() => {
    // Effect logic
  }, []);

  const handleAction = () => {
    // Handler logic
    onAction?.();
  };

  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

#### Naming Conventions

- **Components**: PascalCase (e.g., `DashboardView`, `AIAssistant`)
- **Files**: PascalCase for components (e.g., `Dashboard.tsx`)
- **Functions**: camelCase (e.g., `handleSubmit`, `fetchProjects`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Interfaces**: PascalCase with descriptive names (e.g., `ProjectData`, `IndicatorProps`)

### Python/Django

#### Code Style

- Follow **PEP 8** style guide
- Use **type hints** for function parameters and return values
- Add **docstrings** for all functions and classes
- Use **meaningful variable names**
- Keep functions focused and small

#### Example:

```python
from typing import List, Optional
from django.db import models

def calculate_compliance_score(indicators: List['Indicator']) -> float:
    """
    Calculate overall compliance score based on indicators.
    
    Args:
        indicators: List of Indicator model instances
        
    Returns:
        Compliance score as percentage (0-100)
    """
    if not indicators:
        return 0.0
    
    total_score = sum(ind.score for ind in indicators)
    achieved_score = sum(
        ind.score for ind in indicators 
        if ind.status == 'Compliant'
    )
    
    return (achieved_score / total_score) * 100 if total_score > 0 else 0.0
```

#### Django Best Practices

- Use Django ORM efficiently (avoid N+1 queries)
- Implement proper error handling
- Use Django REST Framework serializers for validation
- Follow RESTful API design principles
- Write migrations for all model changes

### CSS/Styling

- Use **Tailwind CSS** classes
- Follow mobile-first approach
- Use semantic class names when custom CSS is needed
- Keep styles consistent with existing design

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(dashboard): add compliance trend chart

Add a new chart component to visualize compliance trends over time.
Uses Recharts LineChart with monthly aggregation.

Closes #123
```

```
fix(api): handle null values in evidence upload

Previously, uploading evidence without a file would crash.
Now properly validates and handles optional file parameter.

Fixes #456
```

```
docs(readme): update installation instructions

Add detailed steps for Windows users and troubleshooting section.
```

### Best Practices

- Write clear, concise commit messages
- Use present tense ("add feature" not "added feature")
- Reference issues and pull requests when applicable
- Keep commits focused on a single change
- Commit frequently with logical chunks

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**
   - Run the application locally
   - Test affected features thoroughly
   - Check for console errors or warnings

3. **Code quality checks**
   ```bash
   # Frontend
   npm run build  # Ensure build succeeds
   
   # Backend
   python manage.py check
   python manage.py test  # If tests exist
   ```

4. **Update documentation** if needed
   - Update README.md for new features
   - Update API.md for API changes
   - Add comments for complex code

### Submitting the PR

1. **Push your branch** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub
   - Use a clear, descriptive title
   - Fill out the PR template
   - Reference related issues
   - Add screenshots for UI changes

3. **PR Template**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] All builds passing
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Delete your feature branch after merge

---

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version, etc.)
- **Error messages** or console logs

### Feature Requests

Use the feature request template and include:

- **Clear description** of the feature
- **Use case** explaining why it's needed
- **Proposed solution** if you have one
- **Alternatives considered**
- **Additional context**

### Question or Discussion

- Use GitHub Discussions for questions
- Search existing issues/discussions first
- Provide context and what you've tried

---

## Project Structure

### Frontend (`/`)

```
├── components/          # React components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Checklist.tsx   # Compliance checklist
│   └── ...
├── services/           # API services
│   ├── api.ts         # REST API client
│   └── geminiService.ts
├── types.ts           # TypeScript type definitions
├── constants.ts       # Application constants
├── App.tsx           # Root component
├── index.tsx         # Entry point
└── vite.config.ts    # Vite configuration
```

### Backend (`/backend`)

```
backend/
├── api/                    # Main API app
│   ├── models.py          # Data models
│   ├── views.py           # API views
│   ├── serializers.py     # DRF serializers
│   ├── urls.py           # URL routing
│   └── services.py       # Business logic
├── accredify_backend/     # Django project
│   ├── settings.py       # Django settings
│   ├── urls.py          # Root URL config
│   └── wsgi.py
├── manage.py            # Django management
└── requirements.txt     # Python dependencies
```

### Adding New Features

#### New Component

1. Create component file in `/components`
2. Add types to `types.ts` if needed
3. Import and use in parent component
4. Update routing in `App.tsx` if needed

#### New API Endpoint

1. Add view in `backend/api/views.py`
2. Add URL pattern in `backend/api/urls.py`
3. Add serializer if needed in `backend/api/serializers.py`
4. Add client method in `services/api.ts`
5. Update API.md documentation

---

## Testing Guidelines

### Frontend Testing

```bash
# When tests are added:
npm test                # Run all tests
npm test -- --coverage  # With coverage
```

#### Test Structure

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Backend Testing

```bash
cd backend
python manage.py test
```

#### Test Structure

```python
from django.test import TestCase
from rest_framework.test import APITestCase
from .models import Project, Indicator

class IndicatorTestCase(APITestCase):
    def setUp(self):
        self.project = Project.objects.create(
            name="Test Project",
            description="Test Description"
        )
    
    def test_create_indicator(self):
        """Test indicator creation"""
        response = self.client.post('/api/indicators/', {
            'section': 'Test Section',
            'standard': 'Test Standard',
            'indicator': 'Test Indicator',
            'status': 'Not Started'
        })
        self.assertEqual(response.status_code, 201)
```

---

## Questions?

- **Documentation**: Check [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues**: Search existing [GitHub Issues](https://github.com/munaimtahir/Google-Accredify/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/munaimtahir/Google-Accredify/discussions)

---

## Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Part of the project's history

Thank you for contributing to AccrediFy! 🎉
