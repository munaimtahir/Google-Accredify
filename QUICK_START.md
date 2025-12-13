# AccrediFy - Quick Start Guide

## For Developers

### First Time Setup

1. **Clone and Navigate**
   ```bash
   git clone https://github.com/munaimtahir/Google-Accredify.git
   cd Google-Accredify
   ```

2. **Frontend Setup**
   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   npm run dev
   ```
   Open http://localhost:3000

3. **Backend Setup** (in a new terminal)
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env and configure your settings
   python manage.py migrate
   python manage.py runserver
   ```
   API available at http://localhost:8000

## Using Docker (Recommended for Production)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Common Commands

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Check code quality
npm run format       # Format code
npm run type-check   # TypeScript check
```

### Backend
```bash
python manage.py runserver        # Start server
python manage.py migrate          # Run migrations
python manage.py createsuperuser  # Create admin user
python manage.py test            # Run tests
```

### Docker
```bash
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f backend    # View backend logs
docker-compose exec backend bash  # Access backend shell
```

## Project Structure

```
.
├── components/       # React components
├── services/         # API services
├── backend/          # Django backend
│   ├── api/         # API app
│   └── manage.py
├── nginx/           # Nginx config
├── .github/         # CI/CD workflows
├── types.ts         # TypeScript types
├── App.tsx          # Main app component
└── package.json     # Frontend dependencies
```

## Need Help?

- 📖 **Full Documentation**: See [README.md](README.md)
- 🏗️ **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- 🚀 **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- 🤝 **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- 🔒 **Security**: See [SECURITY.md](SECURITY.md)
- 📡 **API Reference**: See [API.md](API.md)

## Quick Tips

1. **Get Gemini API Key**: https://ai.google.dev/
2. **Test AI Features**: Upload a sample compliance CSV
3. **Check Backend**: Visit http://localhost:8000/admin
4. **Build for Production**: `npm run build`
5. **View Documentation**: All `.md` files in root directory

## Troubleshooting

### Port Already in Use
```bash
# Frontend (port 3000)
lsof -ti:3000 | xargs kill

# Backend (port 8000)
lsof -ti:8000 | xargs kill
```

### Database Issues
```bash
cd backend
python manage.py migrate --run-syncdb
```

### Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Ready to start? Run `npm run dev` and `python manage.py runserver`!**
