"""
Tests for AccrediFy API views.
"""

from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Project, Indicator, Evidence
import json


class ProjectViewSetTest(TestCase):
    """Test ProjectViewSet."""
    
    def setUp(self):
        """Set up test client and data."""
        self.client = APIClient()
        self.project = Project.objects.create(
            name="Test Project",
            description="Test Description"
        )
    
    def test_list_projects(self):
        """Test listing projects."""
        url = reverse('project-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Test Project")
    
    def test_create_project(self):
        """Test creating a project."""
        url = reverse('project-list')
        data = {
            'name': 'New Project',
            'description': 'New Description'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(response.data['name'], 'New Project')
    
    def test_create_project_with_indicators(self):
        """Test creating project with indicators."""
        url = reverse('project-list')
        data = {
            'name': 'Project with Indicators',
            'description': 'Test',
            'indicators': [
                {
                    'section': 'Security',
                    'standard': 'ISO 27001',
                    'indicator': 'Requirement 1',
                    'score': 10
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get(name='Project with Indicators')
        self.assertEqual(project.indicators.count(), 1)
    
    def test_delete_project(self):
        """Test deleting a project."""
        url = reverse('project-detail', kwargs={'pk': self.project.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Project.objects.count(), 0)
    
    def test_connect_drive(self):
        """Test connecting Google Drive."""
        url = reverse('project-connect-drive', kwargs={'pk': self.project.id})
        data = {
            'accountName': 'test@example.com',
            'rootFolderId': 'folder123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.project.refresh_from_db()
        self.assertTrue(self.project.drive_is_connected)
        self.assertEqual(self.project.drive_account_name, 'test@example.com')
    
    def test_sync_drive_not_connected(self):
        """Test sync drive when not connected."""
        url = reverse('project-sync-drive', kwargs={'pk': self.project.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_sync_drive_connected(self):
        """Test sync drive when connected."""
        self.project.drive_is_connected = True
        self.project.save()
        
        url = reverse('project-sync-drive', kwargs={'pk': self.project.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.project.refresh_from_db()
        self.assertIsNotNone(self.project.drive_last_sync)


class IndicatorViewSetTest(TestCase):
    """Test IndicatorViewSet."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.project = Project.objects.create(name="Test Project")
        self.indicator = Indicator.objects.create(
            project=self.project,
            section="Security",
            standard="ISO 27001",
            indicator="Test requirement",
            status="Not Started"
        )
    
    def test_update_indicator(self):
        """Test updating an indicator."""
        url = reverse('indicator-detail', kwargs={'pk': self.indicator.id})
        data = {
            'status': 'Compliant',
            'notes': 'Updated notes'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.indicator.refresh_from_db()
        self.assertEqual(self.indicator.status, 'Compliant')
        self.assertEqual(self.indicator.notes, 'Updated notes')
    
    def test_quick_log(self):
        """Test quick log action."""
        url = reverse('indicator-quick-log', kwargs={'pk': self.indicator.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.indicator.refresh_from_db()
        self.assertEqual(self.indicator.status, 'Compliant')


class EvidenceViewSetTest(TestCase):
    """Test EvidenceViewSet."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.project = Project.objects.create(name="Test Project")
        self.indicator = Indicator.objects.create(
            project=self.project,
            section="Test",
            standard="Test",
            indicator="Test"
        )
    
    def test_create_evidence_note(self):
        """Test creating evidence with note."""
        url = reverse('evidence-list')
        data = {
            'indicator': str(self.indicator.id),
            'type': 'note',
            'fileName': 'Test Note',
            'content': 'This is a test note'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Evidence.objects.count(), 1)
        
        evidence = Evidence.objects.first()
        self.assertEqual(evidence.type, 'note')
        self.assertEqual(evidence.content, 'This is a test note')
    
    def test_create_evidence_link(self):
        """Test creating evidence with link."""
        url = reverse('evidence-list')
        data = {
            'indicator': str(self.indicator.id),
            'type': 'link',
            'fileName': 'External Resource',
            'fileUrl': 'https://example.com/resource'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        evidence = Evidence.objects.first()
        self.assertEqual(evidence.type, 'link')
        self.assertEqual(evidence.file_url, 'https://example.com/resource')
    
    def test_create_evidence_without_indicator(self):
        """Test creating evidence without indicator fails."""
        url = reverse('evidence-list')
        data = {
            'type': 'note',
            'content': 'Test'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_evidence_invalid_indicator(self):
        """Test creating evidence with invalid indicator."""
        url = reverse('evidence-list')
        data = {
            'indicator': '00000000-0000-0000-0000-000000000000',
            'type': 'note',
            'content': 'Test'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AIEndpointsTest(TestCase):
    """Test AI service endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.project = Project.objects.create(name="Test")
        self.indicator = Indicator.objects.create(
            project=self.project,
            section="Security",
            standard="ISO 27001",
            indicator="Test requirement"
        )
    
    def test_analyze_checklist(self):
        """Test analyze checklist endpoint."""
        url = reverse('analyze-checklist')
        data = {
            'indicators': [
                {
                    'section': 'Security',
                    'standard': 'ISO 27001',
                    'indicator': 'Test requirement',
                    'status': 'Not Started'
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_analyze_categorization(self):
        """Test analyze categorization endpoint."""
        url = reverse('analyze-categorization')
        data = {
            'indicators': [
                {
                    'section': 'Security',
                    'status': 'Not Started'
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_ask_assistant(self):
        """Test AI assistant endpoint."""
        url = reverse('ask-assistant')
        data = {
            'query': 'What is ISO 27001?',
            'indicators': []
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('response', response.data)
    
    def test_ask_assistant_without_query(self):
        """Test AI assistant without query fails."""
        url = reverse('ask-assistant')
        data = {'indicators': []}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_generate_report_summary(self):
        """Test report summary generation."""
        url = reverse('report-summary')
        data = {
            'indicators': [
                {
                    'section': 'Security',
                    'status': 'Compliant'
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
    
    def test_convert_document(self):
        """Test document conversion."""
        url = reverse('convert-document')
        data = {
            'document_text': 'Sample document with compliance requirements'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csv_content', response.data)
    
    def test_convert_document_without_text(self):
        """Test document conversion without text fails."""
        url = reverse('convert-document')
        data = {}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_generate_compliance_guide(self):
        """Test compliance guide generation."""
        url = reverse('compliance-guide')
        data = {
            'indicator': {
                'section': 'Security',
                'standard': 'ISO 27001',
                'indicator': 'Access control'
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('guide', response.data)
    
    def test_generate_compliance_guide_without_indicator(self):
        """Test compliance guide without indicator fails."""
        url = reverse('compliance-guide')
        data = {}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_analyze_tasks(self):
        """Test task analysis."""
        url = reverse('analyze-tasks')
        data = {
            'indicators': [
                {
                    'id': str(self.indicator.id),
                    'section': 'Security',
                    'status': 'Not Started'
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    @patch('api.ai_services.analyze_checklist')
    def test_analyze_checklist_exception(self, mock_analyze):
        """Test analyze checklist with service exception."""
        mock_analyze.side_effect = Exception("Service error")
        
        url = reverse('analyze-checklist')
        data = {'indicators': []}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
    
    @patch('api.ai_services.analyze_categorization')
    def test_analyze_categorization_exception(self, mock_analyze):
        """Test analyze categorization with service exception."""
        mock_analyze.side_effect = Exception("Service error")
        
        url = reverse('analyze-categorization')
        data = {'indicators': []}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
    
    @patch('api.ai_services.ask_assistant')
    def test_ask_assistant_exception(self, mock_ask):
        """Test ask assistant with service exception."""
        mock_ask.side_effect = Exception("Service error")
        
        url = reverse('ask-assistant')
        data = {'query': 'Test', 'indicators': []}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
    
    @patch('api.ai_services.generate_report_summary')
    def test_generate_report_summary_exception(self, mock_summary):
        """Test report summary with service exception."""
        mock_summary.side_effect = Exception("Service error")
        
        url = reverse('report-summary')
        data = {'indicators': []}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
    
    @patch('api.ai_services.convert_document_to_csv')
    def test_convert_document_exception(self, mock_convert):
        """Test document conversion with service exception."""
        mock_convert.side_effect = Exception("Service error")
        
        url = reverse('convert-document')
        data = {'document_text': 'Test'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
    
    @patch('api.ai_services.generate_compliance_guide')
    def test_generate_compliance_guide_exception(self, mock_guide):
        """Test compliance guide with service exception."""
        mock_guide.side_effect = Exception("Service error")
        
        url = reverse('compliance-guide')
        data = {'indicator': {'section': 'Test'}}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
    
    @patch('api.ai_services.analyze_actionable_tasks')
    def test_analyze_tasks_exception(self, mock_tasks):
        """Test task analysis with service exception."""
        mock_tasks.side_effect = Exception("Service error")
        
        url = reverse('analyze-tasks')
        data = {'indicators': []}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
