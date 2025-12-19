"""
Google Gemini AI services for AccrediFy platform.
"""

import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Constants
MAX_DOCUMENT_LENGTH = 3000  # Maximum document text length to send to AI
MAX_INDICATORS_FOR_PROMPT = 10  # Maximum number of indicators to include in prompts
ANALYZE_CHECKLIST_BATCH_SIZE = 25  # Number of indicators to analyze per API call (balance between token limits and efficiency)

# Google Gemini configuration
def _get_gemini_model():
    """
    Get configured Gemini model instance.
    Returns None if API key is not configured.
    """
    import google.generativeai as genai
    import json
    
    api_key = os.getenv('GEMINI_API_KEY')
    # #region agent log
    log_path = '/root/accredify/google-accredify/.cursor/debug.log'
    try:
        with open(log_path, 'a') as f:
            f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'A', 'location': 'ai_services.py:23', 'message': '_get_gemini_model called', 'data': {'has_api_key': bool(api_key), 'api_key_length': len(api_key) if api_key else 0}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
    except: pass
    # #endregion
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured. AI features will be disabled.")
        return None
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'A', 'location': 'ai_services.py:30', 'message': 'model created successfully', 'data': {'model_type': str(type(model))}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
        except: pass
        # #endregion
        return model
    except Exception as e:
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'A', 'location': 'ai_services.py:32', 'message': 'model creation failed', 'data': {'error_type': str(type(e).__name__), 'error_message': str(e)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
        except: pass
        # #endregion
        logger.error(f"Failed to configure Gemini model: {str(e)}")
        return None


def analyze_checklist(indicators_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Analyze compliance checklist and provide suggestions for all indicators in batches."""
    # #region agent log
    import json
    log_path = '/root/accredify/google-accredify/.cursor/debug.log'
    try:
        with open(log_path, 'a') as f:
            f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'A', 'location': 'ai_services.py:57', 'message': 'analyze_checklist called', 'data': {'indicators_count': len(indicators_data), 'has_api_key': bool(os.getenv('GEMINI_API_KEY'))}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
    except: pass
    # #endregion
    model = _get_gemini_model()
    # #region agent log
    try:
        with open(log_path, 'a') as f:
            f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'A', 'location': 'ai_services.py:67', 'message': 'model check', 'data': {'model_is_none': model is None, 'model_type': str(type(model))}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
    except: pass
    # #endregion
    if not model:
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'A', 'location': 'ai_services.py:74', 'message': 'returning early - no model', 'data': {'indicators_count': len(indicators_data)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
        except: pass
        # #endregion
        return indicators_data
    
    # Process indicators in batches to handle large checklists (150-300 indicators)
    total_indicators = len(indicators_data)
    batch_size = ANALYZE_CHECKLIST_BATCH_SIZE
    num_batches = (total_indicators + batch_size - 1) // batch_size  # Ceiling division
    
    # #region agent log
    try:
        with open(log_path, 'a') as f:
            f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'B', 'location': 'ai_services.py:85', 'message': 'starting batch processing', 'data': {'total_indicators': total_indicators, 'batch_size': batch_size, 'num_batches': num_batches}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
    except: pass
    # #endregion
    
    try:
        for batch_idx in range(num_batches):
            start_idx = batch_idx * batch_size
            end_idx = min(start_idx + batch_size, total_indicators)
            batch_indicators = indicators_data[start_idx:end_idx]
            
            # #region agent log
            try:
                with open(log_path, 'a') as f:
                    f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'B', 'location': 'ai_services.py:93', 'message': 'processing batch', 'data': {'batch_idx': batch_idx, 'start_idx': start_idx, 'end_idx': end_idx, 'batch_size': len(batch_indicators)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
            except: pass
            # #endregion
            
            prompt = f"""
            Analyze the following compliance checklist indicators and provide suggestions for each one.
            Focus on identifying potential risks, gaps, and recommendations.
            
            Checklist Indicators ({len(batch_indicators)} items):
            {_format_indicators_for_prompt(batch_indicators)}
            
            For each indicator, provide:
            1. Risk level (Low/Medium/High)
            2. Key recommendations
            3. Priority actions
            
            Provide a concise analysis for each indicator. Return your analysis in a structured format.
            """
            
            # #region agent log
            try:
                with open(log_path, 'a') as f:
                    f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'B', 'location': 'ai_services.py:110', 'message': 'before API call', 'data': {'prompt_length': len(prompt), 'indicators_in_batch': len(batch_indicators)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
            except: pass
            # #endregion
            
            response = model.generate_content(prompt)
            
            # #region agent log
            try:
                response_text = getattr(response, 'text', None)
                response_type = str(type(response))
                has_text = hasattr(response, 'text')
                with open(log_path, 'a') as f:
                    f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'B', 'location': 'ai_services.py:118', 'message': 'after API call', 'data': {'batch_idx': batch_idx, 'response_type': response_type, 'has_text_attr': has_text, 'response_text_length': len(response_text) if response_text else 0, 'response_text_preview': response_text[:100] if response_text else None}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
            except Exception as log_err:
                try:
                    with open(log_path, 'a') as f:
                        f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'B', 'location': 'ai_services.py:118', 'message': 'after API call - log error', 'data': {'batch_idx': batch_idx, 'log_error': str(log_err)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
                except: pass
            # #endregion
            
            # Add analysis to each indicator in the batch
            response_text = getattr(response, 'text', '') if hasattr(response, 'text') else ''
            # Split response by indicator if possible, otherwise use shared analysis
            analysis_per_indicator = response_text.split('\n\n') if response_text else []
            
            for i, indicator in enumerate(batch_indicators):
                if not indicator.get('aiAnalysis'):
                    # Use indicator-specific analysis if available, otherwise use shared analysis
                    if i < len(analysis_per_indicator) and analysis_per_indicator[i].strip():
                        analysis_content = analysis_per_indicator[i].strip()[:500]  # Limit length
                    else:
                        # Use shared analysis with indicator context
                        analysis_content = f"Analysis for {indicator.get('indicator', 'indicator')} ({indicator.get('section', 'N/A')}): {response_text[:300]}"
                    
                    indicator['aiAnalysis'] = {
                        'content': analysis_content,
                        'timestamp': _get_current_timestamp()
                    }
            
            # #region agent log
            try:
                analyzed_in_batch = sum(1 for ind in batch_indicators if ind.get('aiAnalysis'))
                with open(log_path, 'a') as f:
                    f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'C', 'location': 'ai_services.py:145', 'message': 'batch processed', 'data': {'batch_idx': batch_idx, 'analyzed_in_batch': analyzed_in_batch, 'batch_size': len(batch_indicators)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
            except: pass
            # #endregion
        
        # #region agent log
        try:
            total_analyzed = sum(1 for ind in indicators_data if ind.get('aiAnalysis'))
            with open(log_path, 'a') as f:
                f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'C', 'location': 'ai_services.py:152', 'message': 'all batches complete', 'data': {'total_analyzed': total_analyzed, 'total_indicators': len(indicators_data)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
        except: pass
        # #endregion
        return indicators_data
    except Exception as e:
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps({'sessionId': 'debug-session', 'runId': 'run1', 'hypothesisId': 'D', 'location': 'ai_services.py:155', 'message': 'exception caught', 'data': {'error_type': str(type(e).__name__), 'error_message': str(e), 'error_repr': repr(e)}, 'timestamp': int(__import__('time').time() * 1000)}) + '\n')
        except: pass
        # #endregion
        logger.error(f"Error analyzing checklist: {str(e)}")
        return indicators_data


def analyze_categorization(indicators_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze and categorize compliance indicators."""
    model = _get_gemini_model()
    if not model:
        return {'categories': [], 'insights': 'AI service not configured'}
    
    try:
        prompt = f"""
        Analyze the following compliance indicators and categorize them by:
        1. Risk level (Critical, High, Medium, Low)
        2. Complexity (Complex, Moderate, Simple)
        3. Department/Area affected
        
        Indicators:
        {_format_indicators_for_prompt(indicators_data[:MAX_INDICATORS_FOR_PROMPT])}
        
        Provide a summary of the categorization with key insights.
        """
        
        response = model.generate_content(prompt)
        
        return {
            'analysis': response.text,
            'timestamp': _get_current_timestamp()
        }
    except Exception as e:
        logger.error(f"Error analyzing categorization: {str(e)}")
        return {'error': str(e)}


def ask_assistant(query: str, indicators_data: List[Dict[str, Any]]) -> str:
    """Answer compliance-related questions using AI."""
    model = _get_gemini_model()
    if not model:
        return "AI assistant is not configured. Please set GEMINI_API_KEY."
    
    try:
        context = _format_indicators_for_prompt(indicators_data[:MAX_INDICATORS_FOR_PROMPT])
        prompt = f"""
        You are a compliance management expert. Answer the following question based on the compliance checklist provided.
        
        Context (Compliance Checklist):
        {context}
        
        Question: {query}
        
        Provide a clear, concise, and actionable answer.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error in AI assistant: {str(e)}")
        return f"Error: {str(e)}"


def generate_report_summary(indicators_data: List[Dict[str, Any]]) -> str:
    """Generate a compliance report summary."""
    model = _get_gemini_model()
    if not model:
        return "AI service not configured for report generation."
    
    try:
        # Calculate statistics
        total = len(indicators_data)
        compliant = sum(1 for i in indicators_data if i.get('status') == 'Compliant')
        non_compliant = sum(1 for i in indicators_data if i.get('status') == 'Non-Compliant')
        in_progress = sum(1 for i in indicators_data if i.get('status') == 'In Progress')
        
        prompt = f"""
        Generate a comprehensive compliance report summary based on the following data:
        
        Total Indicators: {total}
        Compliant: {compliant}
        Non-Compliant: {non_compliant}
        In Progress: {in_progress}
        
        Sample Indicators:
        {_format_indicators_for_prompt(indicators_data[:5])}
        
        Include:
        1. Overall compliance status
        2. Key findings
        3. Areas of concern
        4. Recommendations
        5. Next steps
        
        Make it professional and actionable.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating report summary: {str(e)}")
        return f"Error generating summary: {str(e)}"


def convert_document_to_csv(document_text: str) -> str:
    """Convert document text to CSV format for compliance checklist."""
    model = _get_gemini_model()
    if not model:
        return "Section,Standard,Indicator,Evidence Required,Responsible Person,Frequency,Assigned to,Compliance Evidence,Score\nError,N/A,AI service not configured,N/A,N/A,N/A,N/A,N/A,0"
    
    try:
        # Truncate document text to avoid token limits
        truncated_text = document_text[:MAX_DOCUMENT_LENGTH]
        
        prompt = f"""
        Convert the following document text into a CSV format for a compliance checklist.
        
        Document:
        {truncated_text}
        
        Extract compliance requirements and format as CSV with these columns:
        Section,Standard,Indicator,Evidence Required,Responsible Person,Frequency,Assigned to,Compliance Evidence,Score
        
        - Section: The main category or area
        - Standard: The regulation or standard name
        - Indicator: The specific requirement
        - Evidence Required: What evidence is needed
        - Responsible Person: Who should handle it (if mentioned)
        - Frequency: How often (One-time, Monthly, Annually, etc.)
        - Assigned to: Team or person (if mentioned)
        - Compliance Evidence: Current status (leave as 'Pending' if not mentioned)
        - Score: Importance (default to 10)
        
        Return ONLY the CSV data, no explanations.
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error converting document: {str(e)}")
        return f"Error,N/A,{str(e)},N/A,N/A,N/A,N/A,N/A,0"


def generate_compliance_guide(indicator_data: Dict[str, Any]) -> str:
    """Generate a step-by-step compliance guide for an indicator."""
    model = _get_gemini_model()
    if not model:
        return "AI service not configured. Please set GEMINI_API_KEY."
    
    try:
        prompt = f"""
        Create a detailed step-by-step compliance guide for the following requirement:
        
        Section: {indicator_data.get('section', 'N/A')}
        Standard: {indicator_data.get('standard', 'N/A')}
        Requirement: {indicator_data.get('indicator', 'N/A')}
        Evidence Required: {indicator_data.get('description', 'N/A')}
        
        Provide:
        1. Overview of the requirement
        2. Step-by-step implementation guide
        3. Required documentation
        4. Common pitfalls to avoid
        5. Best practices
        6. Estimated time to complete
        
        Make it practical and actionable.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating compliance guide: {str(e)}")
        return f"Error: {str(e)}"


def analyze_actionable_tasks(indicators_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Identify actionable tasks from compliance indicators."""
    model = _get_gemini_model()
    if not model:
        return []
    
    try:
        prompt = f"""
        Analyze the following compliance indicators and identify actionable tasks.
        
        Indicators:
        {_format_indicators_for_prompt(indicators_data[:MAX_INDICATORS_FOR_PROMPT])}
        
        For each indicator, identify:
        1. Immediate actions needed
        2. Priority (High/Medium/Low)
        3. Estimated effort (Hours/Days)
        4. Dependencies
        
        Focus on indicators that are "Not Started" or "In Progress".
        Return a list of tasks in order of priority.
        """
        
        response = model.generate_content(prompt)
        
        # Parse response and create task list
        tasks = []
        for i, indicator in enumerate(indicators_data[:5]):
            if indicator.get('status') in ['Not Started', 'In Progress']:
                tasks.append({
                    'indicatorId': indicator.get('id'),
                    'task': f"Complete {indicator.get('indicator', 'requirement')}",
                    'priority': 'High' if indicator.get('status') == 'Not Started' else 'Medium',
                    'analysis': response.text[:200] if i == 0 else ''
                })
        
        return tasks
    except Exception as e:
        logger.error(f"Error analyzing tasks: {str(e)}")
        return []


def _format_indicators_for_prompt(indicators: List[Dict[str, Any]]) -> str:
    """Format indicators for AI prompt."""
    formatted = []
    for i, ind in enumerate(indicators, 1):
        formatted.append(
            f"{i}. Section: {ind.get('section', 'N/A')}\n"
            f"   Standard: {ind.get('standard', 'N/A')}\n"
            f"   Indicator: {ind.get('indicator', 'N/A')}\n"
            f"   Status: {ind.get('status', 'Not Started')}\n"
        )
    return '\n'.join(formatted)


def _get_current_timestamp() -> str:
    """Get current timestamp in ISO format."""
    from datetime import datetime
    return datetime.utcnow().isoformat() + 'Z'
