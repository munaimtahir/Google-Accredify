"""
Tests for AI services module.
"""

import os
from unittest.mock import patch, MagicMock
from django.test import TestCase
from api import ai_services


class AIServicesTest(TestCase):
    """Test AI service functions."""
    
    def test_get_gemini_model_no_api_key(self):
        """Test that _get_gemini_model returns None when API key is not set."""
        with patch.dict(os.environ, {}, clear=True):
            model = ai_services._get_gemini_model()
            self.assertIsNone(model)
    
    @patch('google.generativeai')
    def test_get_gemini_model_with_api_key(self, mock_genai):
        """Test that _get_gemini_model returns model when API key is set."""
        mock_model = MagicMock()
        mock_genai.GenerativeModel.return_value = mock_model
        
        with patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key'}):
            model = ai_services._get_gemini_model()
            self.assertIsNotNone(model)
            mock_genai.configure.assert_called_once_with(api_key='test-key')
    
    @patch('google.generativeai')
    def test_get_gemini_model_configuration_error(self, mock_genai):
        """Test that _get_gemini_model handles configuration errors."""
        mock_genai.configure.side_effect = Exception("Configuration failed")
        
        with patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key'}):
            model = ai_services._get_gemini_model()
            self.assertIsNone(model)
    
    def test_analyze_checklist_no_api_key(self):
        """Test analyze_checklist without API key returns data unchanged."""
        indicators = [
            {'section': 'Security', 'indicator': 'Test', 'status': 'Not Started'}
        ]
        
        with patch.dict(os.environ, {}, clear=True):
            result = ai_services.analyze_checklist(indicators)
            self.assertEqual(result, indicators)
    
    @patch('api.ai_services._get_gemini_model')
    def test_analyze_checklist_with_model(self, mock_get_model):
        """Test analyze_checklist with working model."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Analysis result: High risk"
        mock_model.generate_content.return_value = mock_response
        mock_get_model.return_value = mock_model
        
        indicators = [
            {'section': 'Security', 'indicator': 'Test', 'status': 'Not Started'}
        ]
        
        result = ai_services.analyze_checklist(indicators)
        self.assertEqual(len(result), 1)
        self.assertIn('aiAnalysis', result[0])
    
    @patch('api.ai_services._get_gemini_model')
    def test_analyze_checklist_with_error(self, mock_get_model):
        """Test analyze_checklist handles errors gracefully."""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_get_model.return_value = mock_model
        
        indicators = [
            {'section': 'Security', 'indicator': 'Test'}
        ]
        
        result = ai_services.analyze_checklist(indicators)
        self.assertEqual(result, indicators)
    
    def test_analyze_categorization_no_api_key(self):
        """Test analyze_categorization without API key."""
        indicators = [{'section': 'Security'}]
        
        with patch.dict(os.environ, {}, clear=True):
            result = ai_services.analyze_categorization(indicators)
            self.assertIn('insights', result)
            self.assertEqual(result['insights'], 'AI service not configured')
    
    @patch('api.ai_services._get_gemini_model')
    def test_analyze_categorization_with_model(self, mock_get_model):
        """Test analyze_categorization with working model."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Categorization analysis"
        mock_model.generate_content.return_value = mock_response
        mock_get_model.return_value = mock_model
        
        indicators = [{'section': 'Security'}]
        
        result = ai_services.analyze_categorization(indicators)
        self.assertIn('analysis', result)
        self.assertIn('timestamp', result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_analyze_categorization_with_error(self, mock_get_model):
        """Test analyze_categorization handles errors."""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_get_model.return_value = mock_model
        
        indicators = [{'section': 'Security'}]
        
        result = ai_services.analyze_categorization(indicators)
        self.assertIn('error', result)
    
    def test_ask_assistant_no_api_key(self):
        """Test ask_assistant without API key."""
        with patch.dict(os.environ, {}, clear=True):
            result = ai_services.ask_assistant("What is ISO 27001?", [])
            self.assertIn('not configured', result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_ask_assistant_with_model(self, mock_get_model):
        """Test ask_assistant with working model."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "ISO 27001 is an information security standard"
        mock_model.generate_content.return_value = mock_response
        mock_get_model.return_value = mock_model
        
        result = ai_services.ask_assistant("What is ISO 27001?", [])
        self.assertIn("information security", result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_ask_assistant_with_error(self, mock_get_model):
        """Test ask_assistant handles errors."""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_get_model.return_value = mock_model
        
        result = ai_services.ask_assistant("Question", [])
        self.assertIn("Error", result)
    
    def test_generate_report_summary_no_api_key(self):
        """Test generate_report_summary without API key."""
        with patch.dict(os.environ, {}, clear=True):
            result = ai_services.generate_report_summary([])
            self.assertIn('not configured', result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_generate_report_summary_with_model(self, mock_get_model):
        """Test generate_report_summary with working model."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Report summary generated"
        mock_model.generate_content.return_value = mock_response
        mock_get_model.return_value = mock_model
        
        indicators = [
            {'status': 'Compliant'},
            {'status': 'Non-Compliant'}
        ]
        
        result = ai_services.generate_report_summary(indicators)
        self.assertIn("Report summary", result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_generate_report_summary_with_error(self, mock_get_model):
        """Test generate_report_summary handles errors."""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_get_model.return_value = mock_model
        
        result = ai_services.generate_report_summary([])
        self.assertIn("Error", result)
    
    def test_convert_document_to_csv_no_api_key(self):
        """Test convert_document_to_csv without API key."""
        with patch.dict(os.environ, {}, clear=True):
            result = ai_services.convert_document_to_csv("Test document")
            self.assertIn('Section', result)
            self.assertIn('Error', result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_convert_document_to_csv_with_model(self, mock_get_model):
        """Test convert_document_to_csv with working model."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Section,Standard,Indicator\nSec1,Std1,Ind1"
        mock_model.generate_content.return_value = mock_response
        mock_get_model.return_value = mock_model
        
        result = ai_services.convert_document_to_csv("Test document")
        self.assertIn("Section", result)
        self.assertIn("Sec1", result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_convert_document_to_csv_with_error(self, mock_get_model):
        """Test convert_document_to_csv handles errors."""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_get_model.return_value = mock_model
        
        result = ai_services.convert_document_to_csv("Test")
        self.assertIn("Error", result)
    
    def test_generate_compliance_guide_no_api_key(self):
        """Test generate_compliance_guide without API key."""
        with patch.dict(os.environ, {}, clear=True):
            result = ai_services.generate_compliance_guide({'indicator': 'Test'})
            self.assertIn('not configured', result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_generate_compliance_guide_with_model(self, mock_get_model):
        """Test generate_compliance_guide with working model."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Step 1: Do this\nStep 2: Do that"
        mock_model.generate_content.return_value = mock_response
        mock_get_model.return_value = mock_model
        
        indicator = {
            'section': 'Security',
            'standard': 'ISO 27001',
            'indicator': 'Test requirement'
        }
        
        result = ai_services.generate_compliance_guide(indicator)
        self.assertIn("Step", result)
    
    @patch('api.ai_services._get_gemini_model')
    def test_generate_compliance_guide_with_error(self, mock_get_model):
        """Test generate_compliance_guide handles errors."""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_get_model.return_value = mock_model
        
        result = ai_services.generate_compliance_guide({'indicator': 'Test'})
        self.assertIn("Error", result)
    
    def test_analyze_actionable_tasks_no_api_key(self):
        """Test analyze_actionable_tasks without API key."""
        with patch.dict(os.environ, {}, clear=True):
            result = ai_services.analyze_actionable_tasks([])
            self.assertEqual(result, [])
    
    @patch('api.ai_services._get_gemini_model')
    def test_analyze_actionable_tasks_with_model(self, mock_get_model):
        """Test analyze_actionable_tasks with working model."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Task analysis complete"
        mock_model.generate_content.return_value = mock_response
        mock_get_model.return_value = mock_model
        
        indicators = [
            {
                'id': '123',
                'indicator': 'Test requirement',
                'status': 'Not Started'
            }
        ]
        
        result = ai_services.analyze_actionable_tasks(indicators)
        self.assertIsInstance(result, list)
        if len(result) > 0:
            self.assertIn('task', result[0])
    
    @patch('api.ai_services._get_gemini_model')
    def test_analyze_actionable_tasks_with_error(self, mock_get_model):
        """Test analyze_actionable_tasks handles errors."""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_get_model.return_value = mock_model
        
        result = ai_services.analyze_actionable_tasks([])
        self.assertEqual(result, [])
    
    def test_format_indicators_for_prompt(self):
        """Test _format_indicators_for_prompt helper function."""
        indicators = [
            {
                'section': 'Security',
                'standard': 'ISO 27001',
                'indicator': 'Test requirement',
                'status': 'Not Started'
            }
        ]
        
        result = ai_services._format_indicators_for_prompt(indicators)
        self.assertIn('Security', result)
        self.assertIn('ISO 27001', result)
        self.assertIn('Test requirement', result)
    
    def test_get_current_timestamp(self):
        """Test _get_current_timestamp helper function."""
        timestamp = ai_services._get_current_timestamp()
        self.assertIsInstance(timestamp, str)
        self.assertIn('Z', timestamp)
