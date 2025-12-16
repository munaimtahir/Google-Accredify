"""
Tests for AccrediFy models.
"""

from django.test import TestCase
from django.utils import timezone
from api.models import Project, Indicator, Evidence


class ProjectModelTest(TestCase):
    """Test Project model."""
    
    def test_create_project(self):
        """Test creating a project."""
        project = Project.objects.create(
            name="Test Project",
            description="Test Description"
        )
        
        self.assertIsNotNone(project.id)
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.description, "Test Description")
        self.assertIsNotNone(project.created_at)
        self.assertFalse(project.drive_is_connected)
    
    def test_project_str(self):
        """Test project string representation."""
        project = Project.objects.create(name="My Project")
        self.assertEqual(str(project), "My Project")
    
    def test_project_drive_config(self):
        """Test Google Drive configuration fields."""
        project = Project.objects.create(
            name="Test",
            drive_is_connected=True,
            drive_account_name="test@example.com",
            drive_root_folder_id="folder123"
        )
        
        self.assertTrue(project.drive_is_connected)
        self.assertEqual(project.drive_account_name, "test@example.com")
        self.assertEqual(project.drive_root_folder_id, "folder123")


class IndicatorModelTest(TestCase):
    """Test Indicator model."""
    
    def setUp(self):
        """Set up test data."""
        self.project = Project.objects.create(
            name="Test Project",
            description="Test"
        )
    
    def test_create_indicator(self):
        """Test creating an indicator."""
        indicator = Indicator.objects.create(
            project=self.project,
            section="Security",
            standard="ISO 27001",
            indicator="Test requirement",
            description="Test evidence",
            score=10,
            status="Not Started"
        )
        
        self.assertIsNotNone(indicator.id)
        self.assertEqual(indicator.section, "Security")
        self.assertEqual(indicator.standard, "ISO 27001")
        self.assertEqual(indicator.status, "Not Started")
        self.assertEqual(indicator.score, 10)
        self.assertIsNotNone(indicator.last_updated)
    
    def test_indicator_default_values(self):
        """Test indicator default values."""
        indicator = Indicator.objects.create(
            project=self.project,
            section="Test",
            standard="Test",
            indicator="Test"
        )
        
        self.assertEqual(indicator.score, 10)
        self.assertEqual(indicator.status, "Not Started")
    
    def test_indicator_cascade_delete(self):
        """Test that indicators are deleted when project is deleted."""
        Indicator.objects.create(
            project=self.project,
            section="Test",
            standard="Test",
            indicator="Test"
        )
        
        self.assertEqual(Indicator.objects.count(), 1)
        self.project.delete()
        self.assertEqual(Indicator.objects.count(), 0)
    
    def test_indicator_str(self):
        """Test indicator string representation."""
        indicator = Indicator.objects.create(
            project=self.project,
            section="Security",
            standard="ISO",
            indicator="Long requirement text that should be truncated"
        )
        
        str_repr = str(indicator)
        self.assertIn("Security", str_repr)


class EvidenceModelTest(TestCase):
    """Test Evidence model."""
    
    def setUp(self):
        """Set up test data."""
        self.project = Project.objects.create(name="Test Project")
        self.indicator = Indicator.objects.create(
            project=self.project,
            section="Test",
            standard="Test",
            indicator="Test requirement"
        )
    
    def test_create_evidence_note(self):
        """Test creating evidence with note."""
        evidence = Evidence.objects.create(
            indicator=self.indicator,
            type="note",
            file_name="Test Note",
            content="This is a test note"
        )
        
        self.assertIsNotNone(evidence.id)
        self.assertEqual(evidence.type, "note")
        self.assertEqual(evidence.content, "This is a test note")
        self.assertIsNotNone(evidence.date_uploaded)
        self.assertEqual(evidence.sync_status, "pending")
    
    def test_create_evidence_link(self):
        """Test creating evidence with link."""
        evidence = Evidence.objects.create(
            indicator=self.indicator,
            type="link",
            file_name="External Link",
            file_url="https://example.com/evidence"
        )
        
        self.assertEqual(evidence.type, "link")
        self.assertEqual(evidence.file_url, "https://example.com/evidence")
    
    def test_evidence_cascade_delete(self):
        """Test that evidence is deleted when indicator is deleted."""
        Evidence.objects.create(
            indicator=self.indicator,
            type="note",
            content="Test"
        )
        
        self.assertEqual(Evidence.objects.count(), 1)
        self.indicator.delete()
        self.assertEqual(Evidence.objects.count(), 0)
    
    def test_evidence_str(self):
        """Test evidence string representation."""
        evidence = Evidence.objects.create(
            indicator=self.indicator,
            type="document",
            file_name="test.pdf"
        )
        
        str_repr = str(evidence)
        self.assertIn("document", str_repr)
