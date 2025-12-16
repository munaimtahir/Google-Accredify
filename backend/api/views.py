"""
Django REST Framework views for AccrediFy API.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
import logging

from .models import Project, Indicator, Evidence
from .serializers import (
    ProjectSerializer, 
    ProjectCreateSerializer,
    IndicatorSerializer, 
    EvidenceSerializer
)
from . import ai_services

logger = logging.getLogger(__name__)


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project model."""
    
    queryset = Project.objects.all().prefetch_related('indicators__evidence')
    
    def get_serializer_class(self):
        """Use different serializer for creation."""
        if self.action == 'create':
            return ProjectCreateSerializer
        return ProjectSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new project."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        
        # Return full project with indicators
        return_serializer = ProjectSerializer(project)
        return Response(return_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def connect_drive(self, request, pk=None):
        """Connect Google Drive to project."""
        project = self.get_object()
        
        # In production, this would handle OAuth flow
        # For now, just simulate connection
        project.drive_is_connected = True
        project.drive_account_name = request.data.get('accountName', 'User Account')
        project.drive_root_folder_id = request.data.get('rootFolderId', 'root')
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data.get('driveConfig'))
    
    @action(detail=True, methods=['post'])
    def sync_drive(self, request, pk=None):
        """Sync project to Google Drive."""
        project = self.get_object()
        
        if not project.drive_is_connected:
            return Response(
                {'error': 'Google Drive not connected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update last sync time
        project.drive_last_sync = timezone.now()
        project.save()
        
        # In production, this would sync files to Drive
        # For now, just return success
        serializer = self.get_serializer(project)
        return Response(serializer.data)


class IndicatorViewSet(viewsets.ModelViewSet):
    """ViewSet for Indicator model."""
    
    queryset = Indicator.objects.all().select_related('project').prefetch_related('evidence')
    serializer_class = IndicatorSerializer
    
    def update(self, request, *args, **kwargs):
        """Update indicator (PATCH or PUT)."""
        partial = kwargs.pop('partial', True)  # Always allow partial updates
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def quick_log(self, request, pk=None):
        """Quick log completion for an indicator."""
        indicator = self.get_object()
        
        # Update status to compliant and add timestamp
        indicator.status = 'Compliant'
        indicator.last_updated = timezone.now().date()
        indicator.save()
        
        serializer = self.get_serializer(indicator)
        return Response(serializer.data)


class EvidenceViewSet(viewsets.ModelViewSet):
    """ViewSet for Evidence model."""
    
    queryset = Evidence.objects.all().select_related('indicator')
    serializer_class = EvidenceSerializer
    
    def create(self, request, *args, **kwargs):
        """Create new evidence with file upload."""
        # Get indicator ID from request
        indicator_id = request.data.get('indicator')
        if not indicator_id:
            return Response(
                {'error': 'indicator field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            indicator = Indicator.objects.get(id=indicator_id)
        except Indicator.DoesNotExist:
            return Response(
                {'error': 'Indicator not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create evidence
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save(indicator=indicator)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# AI Service API Views

@api_view(['POST'])
def analyze_checklist(request):
    """Analyze compliance checklist using AI."""
    try:
        indicators_data = request.data.get('indicators', [])
        analyzed_indicators = ai_services.analyze_checklist(indicators_data)
        return Response(analyzed_indicators)
    except Exception as e:
        logger.error(f"Error analyzing checklist: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def analyze_categorization(request):
    """Analyze and categorize compliance indicators."""
    try:
        indicators_data = request.data.get('indicators', [])
        analysis = ai_services.analyze_categorization(indicators_data)
        return Response(analysis)
    except Exception as e:
        logger.error(f"Error analyzing categorization: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def ask_assistant(request):
    """Ask the AI compliance assistant a question."""
    try:
        query = request.data.get('query', '')
        indicators_data = request.data.get('indicators', [])
        
        if not query:
            return Response(
                {'error': 'query field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response_text = ai_services.ask_assistant(query, indicators_data)
        return Response({'response': response_text})
    except Exception as e:
        logger.error(f"Error in AI assistant: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def generate_report_summary(request):
    """Generate a compliance report summary."""
    try:
        indicators_data = request.data.get('indicators', [])
        summary = ai_services.generate_report_summary(indicators_data)
        return Response({'summary': summary})
    except Exception as e:
        logger.error(f"Error generating report summary: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def convert_document(request):
    """Convert document text to CSV format."""
    try:
        document_text = request.data.get('document_text', '')
        
        if not document_text:
            return Response(
                {'error': 'document_text field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_content = ai_services.convert_document_to_csv(document_text)
        return Response({'csv_content': csv_content})
    except Exception as e:
        logger.error(f"Error converting document: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def generate_compliance_guide(request):
    """Generate a step-by-step compliance guide."""
    try:
        indicator_data = request.data.get('indicator', {})
        
        if not indicator_data:
            return Response(
                {'error': 'indicator field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        guide = ai_services.generate_compliance_guide(indicator_data)
        return Response({'guide': guide})
    except Exception as e:
        logger.error(f"Error generating compliance guide: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def analyze_tasks(request):
    """Analyze checklist for actionable tasks."""
    try:
        indicators_data = request.data.get('indicators', [])
        tasks = ai_services.analyze_actionable_tasks(indicators_data)
        return Response(tasks)
    except Exception as e:
        logger.error(f"Error analyzing tasks: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
