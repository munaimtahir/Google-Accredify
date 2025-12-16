"""
URL routing for AccrediFy API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'indicators', views.IndicatorViewSet, basename='indicator')
router.register(r'evidence', views.EvidenceViewSet, basename='evidence')

# URL patterns
urlpatterns = [
    # ViewSet routes
    path('', include(router.urls)),
    
    # AI service endpoints
    path('analyze-checklist/', views.analyze_checklist, name='analyze-checklist'),
    path('analyze-categorization/', views.analyze_categorization, name='analyze-categorization'),
    path('ask-assistant/', views.ask_assistant, name='ask-assistant'),
    path('report-summary/', views.generate_report_summary, name='report-summary'),
    path('convert-document/', views.convert_document, name='convert-document'),
    path('compliance-guide/', views.generate_compliance_guide, name='compliance-guide'),
    path('analyze-tasks/', views.analyze_tasks, name='analyze-tasks'),
]
