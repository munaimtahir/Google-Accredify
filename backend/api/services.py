"""
Business logic services for AccrediFy.
"""

import logging
from typing import List, Dict, Any
from django.db import transaction
from .models import Project, Indicator, Evidence

logger = logging.getLogger(__name__)


def bulk_create_indicators(project: Project, indicators_data: List[Dict[str, Any]]) -> List[Indicator]:
    """
    Bulk create indicators for a project.
    
    Args:
        project: Project instance
        indicators_data: List of indicator data dictionaries
    
    Returns:
        List of created Indicator instances
    """
    indicators = []
    
    with transaction.atomic():
        for data in indicators_data:
            indicator = Indicator.objects.create(
                project=project,
                section=data.get('section', ''),
                standard=data.get('standard', ''),
                indicator=data.get('indicator', ''),
                description=data.get('description', ''),
                score=data.get('score', 10),
                responsible_person=data.get('responsiblePerson'),
                frequency=data.get('frequency'),
                assignee=data.get('assignee'),
                status=data.get('status', 'Not Started')
            )
            indicators.append(indicator)
    
    return indicators


def calculate_project_compliance_score(project: Project) -> Dict[str, Any]:
    """
    Calculate overall compliance score for a project.
    
    Args:
        project: Project instance
    
    Returns:
        Dictionary with compliance metrics
    """
    indicators = project.indicators.all()
    total_count = indicators.count()
    
    if total_count == 0:
        return {
            'totalScore': 0,
            'maxScore': 0,
            'percentage': 0,
            'breakdown': {}
        }
    
    # Count by status
    status_counts = {}
    for status_choice, _ in Indicator.STATUS_CHOICES:
        count = indicators.filter(status=status_choice).count()
        status_counts[status_choice] = count
    
    # Calculate score
    compliant_count = status_counts.get('Compliant', 0)
    total_possible_score = sum(ind.score for ind in indicators)
    compliant_score = sum(ind.score for ind in indicators.filter(status='Compliant'))
    
    percentage = (compliant_score / total_possible_score * 100) if total_possible_score > 0 else 0
    
    return {
        'totalScore': compliant_score,
        'maxScore': total_possible_score,
        'percentage': round(percentage, 2),
        'breakdown': status_counts,
        'totalIndicators': total_count,
        'compliantCount': compliant_count
    }


def get_compliance_summary(project: Project) -> Dict[str, Any]:
    """
    Get comprehensive compliance summary for a project.
    
    Args:
        project: Project instance
    
    Returns:
        Dictionary with detailed compliance summary
    """
    indicators = project.indicators.all()
    
    # Group by section
    sections = {}
    for indicator in indicators:
        section = indicator.section
        if section not in sections:
            sections[section] = {
                'total': 0,
                'compliant': 0,
                'non_compliant': 0,
                'in_progress': 0,
                'not_started': 0
            }
        
        sections[section]['total'] += 1
        if indicator.status == 'Compliant':
            sections[section]['compliant'] += 1
        elif indicator.status == 'Non-Compliant':
            sections[section]['non_compliant'] += 1
        elif indicator.status == 'In Progress':
            sections[section]['in_progress'] += 1
        elif indicator.status == 'Not Started':
            sections[section]['not_started'] += 1
    
    return {
        'projectId': str(project.id),
        'projectName': project.name,
        'sections': sections,
        'overallScore': calculate_project_compliance_score(project)
    }
