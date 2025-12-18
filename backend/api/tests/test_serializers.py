"""
Tests for AccrediFy serializers.
"""

from django.test import TestCase
from api.models import Project, Indicator, Evidence
from api.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    IndicatorSerializer,
    EvidenceSerializer
)


class ProjectSerializerTest(TestCase):
    """Test ProjectSerializer."""
    
    def test_serialize_project(self):
        """Test serializing a project."""
        project = Project.objects.create(
            name="Test Project",
            description="Test Description"
        )
        
        serializer = ProjectSerializer(project)
        data = serializer.data
        
        self.assertEqual(data['name'], "Test Project")
        self.assertEqual(data['description'], "Test Description")
        self.assertIn('id', data)
        self.assertIn('createdAt', data)
        self.assertIn('indicators', data)
        self.assertIn('driveConfig', data)
    
    def test_serialize_project_with_indicators(self):
        """Test serializing project with indicators."""
        project = Project.objects.create(name="Test")
        
        Indicator.objects.create(
            project=project,
            section="Security",
            standard="ISO 27001",
            indicator="Test requirement"
        )
        
        serializer = ProjectSerializer(project)
        data = serializer.data
        
        self.assertEqual(len(data['indicators']), 1)
        self.assertEqual(data['indicators'][0]['section'], "Security")
    
    def test_drive_config_serialization(self):
        """Test Google Drive config serialization."""
        project = Project.objects.create(
            name="Test",
            drive_is_connected=True,
            drive_account_name="test@example.com"
        )
        
        serializer = ProjectSerializer(project)
        drive_config = serializer.data['driveConfig']
        
        self.assertTrue(drive_config['isConnected'])
        self.assertEqual(drive_config['accountName'], "test@example.com")


class ProjectCreateSerializerTest(TestCase):
    """Test ProjectCreateSerializer."""
    
    def test_create_project_with_indicators(self):
        """Test creating project with nested indicators."""
        data = {
            'name': 'New Project',
            'description': 'New Description',
            'indicators': [
                {
                    'section': 'Security',
                    'standard': 'ISO 27001',
                    'indicator': 'Requirement 1',
                    'description': 'Evidence needed',
                    'score': 10,
                    'status': 'Not Started'
                },
                {
                    'section': 'Privacy',
                    'standard': 'GDPR',
                    'indicator': 'Requirement 2',
                    'score': 15
                }
            ]
        }
        
        serializer = ProjectCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        project = serializer.save()
        
        self.assertEqual(project.name, 'New Project')
        self.assertEqual(project.indicators.count(), 2)
        
        indicator1 = project.indicators.get(section='Security')
        self.assertEqual(indicator1.standard, 'ISO 27001')
        self.assertEqual(indicator1.score, 10)


class IndicatorSerializerTest(TestCase):
    """Test IndicatorSerializer."""
    
    def setUp(self):
        """Set up test data."""
        self.project = Project.objects.create(name="Test Project")
    
    def test_serialize_indicator(self):
        """Test serializing an indicator."""
        indicator = Indicator.objects.create(
            project=self.project,
            section="Security",
            standard="ISO 27001",
            indicator="Test requirement",
            description="Test evidence",
            score=10,
            responsible_person="John Doe",
            frequency="Monthly",
            assignee="Jane Smith",
            status="In Progress"
        )
        
        serializer = IndicatorSerializer(indicator)
        data = serializer.data
        
        self.assertEqual(data['section'], "Security")
        self.assertEqual(data['standard'], "ISO 27001")
        self.assertEqual(data['responsiblePerson'], "John Doe")
        self.assertEqual(data['frequency'], "Monthly")
        self.assertEqual(data['assignee'], "Jane Smith")
        self.assertEqual(data['status'], "In Progress")
        self.assertIn('lastUpdated', data)
        self.assertIn('evidence', data)
    
    def test_indicator_with_evidence(self):
        """Test serializing indicator with evidence."""
        indicator = Indicator.objects.create(
            project=self.project,
            section="Test",
            standard="Test",
            indicator="Test"
        )
        
        Evidence.objects.create(
            indicator=indicator,
            type="note",
            file_name="Test Note",
            content="Test content"
        )
        
        serializer = IndicatorSerializer(indicator)
        data = serializer.data
        
        self.assertEqual(len(data['evidence']), 1)
        self.assertEqual(data['evidence'][0]['type'], "note")
    
    def test_validate_score(self):
        """Test score validation."""
        data = {
            'section': 'Test',
            'standard': 'Test',
            'indicator': 'Test',
            'score': -5
        }
        
        serializer = IndicatorSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('score', serializer.errors)
    
    def test_validate_positive_score(self):
        """Test valid positive score."""
        data = {
            'section': 'Test',
            'standard': 'Test',
            'indicator': 'Test',
            'score': 10
        }
        
        serializer = IndicatorSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class EvidenceSerializerTest(TestCase):
    """Test EvidenceSerializer."""
    
    def setUp(self):
        """Set up test data."""
        self.project = Project.objects.create(name="Test")
        self.indicator = Indicator.objects.create(
            project=self.project,
            section="Test",
            standard="Test",
            indicator="Test"
        )
    
    def test_serialize_evidence(self):
        """Test serializing evidence."""
        evidence = Evidence.objects.create(
            indicator=self.indicator,
            type="note",
            file_name="Test Note",
            content="Test content",
            file_size="1.5 KB"
        )
        
        serializer = EvidenceSerializer(evidence)
        data = serializer.data
        
        self.assertEqual(data['type'], "note")
        self.assertEqual(data['fileName'], "Test Note")
        self.assertEqual(data['content'], "Test content")
        self.assertEqual(data['fileSize'], "1.5 KB")
        self.assertIn('dateUploaded', data)
        self.assertIn('syncStatus', data)
    
    def test_serialize_evidence_with_drive_sync(self):
        """Test serializing evidence with Drive sync data."""
        evidence = Evidence.objects.create(
            indicator=self.indicator,
            type="document",
            file_name="test.pdf",
            drive_file_id="file123",
            drive_view_link="https://drive.google.com/file/d/file123",
            sync_status="synced"
        )
        
        serializer = EvidenceSerializer(evidence)
        data = serializer.data
        
        self.assertEqual(data['driveFileId'], "file123")
        self.assertIn('drive.google.com', data['driveViewLink'])
        self.assertEqual(data['syncStatus'], "synced")
    
    def test_create_evidence_with_file(self):
        """Test creating evidence with file upload."""
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create a mock file
        file_content = b'Test file content'
        uploaded_file = SimpleUploadedFile(
            "test_document.pdf",
            file_content,
            content_type="application/pdf"
        )
        
        # Mock request with file
        from rest_framework.request import Request
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.post('/api/evidence/')
        request.FILES['file'] = uploaded_file
        
        data = {
            'type': 'document',
            'indicator': self.indicator.id
        }
        
        serializer = EvidenceSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        evidence = serializer.save(indicator=self.indicator)
        
        self.assertEqual(evidence.file_name, 'test_document.pdf')
        self.assertIsNotNone(evidence.file)
        self.assertIsNotNone(evidence.file_size)
    
    def test_create_evidence_with_large_file(self):
        """Test creating evidence with large file (>1MB)."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create a smaller file but simulate large size for testing
        # This is more efficient than creating a 2MB in-memory file
        file_content = b'Test content for large file simulation'
        uploaded_file = SimpleUploadedFile(
            "large_file.pdf",
            file_content,
            content_type="application/pdf"
        )
        # Manually set size to simulate a large file
        uploaded_file.size = 2 * 1024 * 1024  # 2MB
        
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.post('/api/evidence/')
        request.FILES['file'] = uploaded_file
        
        data = {
            'type': 'document',
            'indicator': self.indicator.id
        }
        
        serializer = EvidenceSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        evidence = serializer.save(indicator=self.indicator)
        
        # File size should be in MB for large files
        self.assertIn('MB', evidence.file_size)
