"""
Django REST Framework views for AccrediFy API.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, throttle_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.conf import settings
import logging
import os
import json
import hashlib

from .models import Project, Indicator, Evidence
from .serializers import (
    ProjectSerializer, 
    ProjectCreateSerializer,
    IndicatorSerializer, 
    EvidenceSerializer
)
from . import ai_services

logger = logging.getLogger(__name__)

def _ai_cache_key(request, prefix: str, payload: dict) -> str:
    """
    Cache key includes user id (if authenticated) and a hash of the request payload.
    Prevents leaking cached AI responses across different users.
    """
    user_part = 'anon'
    if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False):
        user_part = str(request.user.id)
    raw = json.dumps(payload, sort_keys=True, default=str, separators=(',', ':'))
    digest = hashlib.sha256(raw.encode('utf-8')).hexdigest()
    return f"accredify:ai:{prefix}:{user_part}:{digest}"


class AIEndpointThrottle(UserRateThrottle):
    """Custom throttle for AI endpoints with stricter rate limits."""
    scope = 'ai_endpoint'


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for monitoring and Docker health checks."""
    try:
        # Check database connection
        connection.ensure_connection()
        db_status = 'connected'
        
        return JsonResponse({
            'status': 'healthy',
            'database': db_status,
            'service': 'accredify-api'
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'service': 'accredify-api'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user."""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        
        if not username or not password:
            return Response(
                {'error': 'username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        return Response(
            {'error': 'Registration failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login and get JWT tokens."""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
        
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return Response(
            {'error': 'Login failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
        # PATCH allows partial updates, PUT requires full object
        partial = request.method == 'PATCH'
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
    
    # Allowed file extensions and MIME types
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx', 
                          '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'}
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/svg+xml'
    }
    MAX_FILE_SIZE = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024)  # 10MB default
    
    def _validate_file(self, file):
        """Validate uploaded file."""
        # Check file size
        if file.size > self.MAX_FILE_SIZE:
            raise ValidationError(
                f'File size exceeds maximum allowed size of {self.MAX_FILE_SIZE / (1024 * 1024):.1f}MB'
            )
        
        # Check file extension
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise ValidationError(
                f'File type "{file_ext}" is not allowed. Allowed types: {", ".join(self.ALLOWED_EXTENSIONS)}'
            )
        
        # Check MIME type (if available)
        if hasattr(file, 'content_type') and file.content_type:
            if file.content_type not in self.ALLOWED_MIME_TYPES:
                # Log warning but don't reject - MIME types can be unreliable
                logger.warning(f'Unexpected MIME type {file.content_type} for file {file.name}')
        
        # Additional security: check file name
        if '..' in file.name or '/' in file.name or '\\' in file.name:
            raise ValidationError('Invalid file name')
        
        return True
    
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
        
        # Validate file if present
        if 'file' in request.FILES:
            try:
                file = request.FILES['file']
                self._validate_file(file)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                logger.error(f"Error validating file: {str(e)}")
                return Response(
                    {'error': 'File validation failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create evidence
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save(indicator=indicator)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# AI Service API Views

@api_view(['POST'])
@throttle_classes([AIEndpointThrottle])
def analyze_checklist(request):
    """Analyze compliance checklist using AI."""
    try:
        indicators_data = request.data.get('indicators', [])
        payload = {'indicators': indicators_data}
        key = _ai_cache_key(request, 'analyze_checklist', payload)
        cached = cache.get(key)
        if cached is not None:
            return Response(cached)

        analyzed_indicators = ai_services.analyze_checklist(indicators_data)
        cache.set(key, analyzed_indicators, timeout=getattr(settings, 'AI_CACHE_TTL', 3600))
        return Response(analyzed_indicators)
    except Exception as e:
        logger.error(f"Error analyzing checklist: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@throttle_classes([AIEndpointThrottle])
def analyze_categorization(request):
    """Analyze and categorize compliance indicators."""
    try:
        indicators_data = request.data.get('indicators', [])
        payload = {'indicators': indicators_data}
        key = _ai_cache_key(request, 'analyze_categorization', payload)
        cached = cache.get(key)
        if cached is not None:
            return Response(cached)

        analysis = ai_services.analyze_categorization(indicators_data)
        cache.set(key, analysis, timeout=getattr(settings, 'AI_CACHE_TTL', 3600))
        return Response(analysis)
    except Exception as e:
        logger.error(f"Error analyzing categorization: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@throttle_classes([AIEndpointThrottle])
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
        
        payload = {'query': query, 'indicators': indicators_data}
        key = _ai_cache_key(request, 'ask_assistant', payload)
        cached = cache.get(key)
        if cached is not None:
            return Response({'response': cached})

        response_text = ai_services.ask_assistant(query, indicators_data)
        cache.set(key, response_text, timeout=getattr(settings, 'AI_CACHE_TTL', 3600))
        return Response({'response': response_text})
    except Exception as e:
        logger.error(f"Error in AI assistant: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@throttle_classes([AIEndpointThrottle])
def generate_report_summary(request):
    """Generate a compliance report summary."""
    try:
        indicators_data = request.data.get('indicators', [])
        payload = {'indicators': indicators_data}
        key = _ai_cache_key(request, 'report_summary', payload)
        cached = cache.get(key)
        if cached is not None:
            return Response({'summary': cached})

        summary = ai_services.generate_report_summary(indicators_data)
        cache.set(key, summary, timeout=getattr(settings, 'AI_CACHE_TTL', 3600))
        return Response({'summary': summary})
    except Exception as e:
        logger.error(f"Error generating report summary: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@throttle_classes([AIEndpointThrottle])
def convert_document(request):
    """Convert document text to CSV format."""
    try:
        document_text = request.data.get('document_text', '')
        
        if not document_text:
            return Response(
                {'error': 'document_text field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payload = {'document_text': document_text}
        key = _ai_cache_key(request, 'convert_document', payload)
        cached = cache.get(key)
        if cached is not None:
            return Response({'csv_content': cached})

        csv_content = ai_services.convert_document_to_csv(document_text)
        cache.set(key, csv_content, timeout=getattr(settings, 'AI_CACHE_TTL', 3600))
        return Response({'csv_content': csv_content})
    except Exception as e:
        logger.error(f"Error converting document: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@throttle_classes([AIEndpointThrottle])
def generate_compliance_guide(request):
    """Generate a step-by-step compliance guide."""
    try:
        indicator_data = request.data.get('indicator', {})
        
        if not indicator_data:
            return Response(
                {'error': 'indicator field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payload = {'indicator': indicator_data}
        key = _ai_cache_key(request, 'compliance_guide', payload)
        cached = cache.get(key)
        if cached is not None:
            return Response({'guide': cached})

        guide = ai_services.generate_compliance_guide(indicator_data)
        cache.set(key, guide, timeout=getattr(settings, 'AI_CACHE_TTL', 3600))
        return Response({'guide': guide})
    except Exception as e:
        logger.error(f"Error generating compliance guide: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@throttle_classes([AIEndpointThrottle])
def analyze_tasks(request):
    """Analyze checklist for actionable tasks."""
    try:
        indicators_data = request.data.get('indicators', [])
        payload = {'indicators': indicators_data}
        key = _ai_cache_key(request, 'analyze_tasks', payload)
        cached = cache.get(key)
        if cached is not None:
            return Response(cached)

        tasks = ai_services.analyze_actionable_tasks(indicators_data)
        cache.set(key, tasks, timeout=getattr(settings, 'AI_CACHE_TTL', 3600))
        return Response(tasks)
    except Exception as e:
        logger.error(f"Error analyzing tasks: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
