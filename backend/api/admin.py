"""
Django admin configuration for AccrediFy models.
"""

from django.contrib import admin
from .models import Project, Indicator, Evidence


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin interface for Project model."""
    
    list_display = ['name', 'created_at', 'drive_is_connected', 'indicator_count']
    list_filter = ['drive_is_connected', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description', 'created_at')
        }),
        ('Google Drive Integration', {
            'fields': (
                'drive_is_connected',
                'drive_account_name',
                'drive_root_folder_id',
                'drive_last_sync'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def indicator_count(self, obj):
        """Display count of indicators."""
        return obj.indicators.count()
    indicator_count.short_description = 'Indicators'


@admin.register(Indicator)
class IndicatorAdmin(admin.ModelAdmin):
    """Admin interface for Indicator model."""
    
    list_display = [
        'section', 'standard', 'indicator_short', 
        'status', 'score', 'last_updated', 'evidence_count'
    ]
    list_filter = ['status', 'frequency', 'section', 'last_updated']
    search_fields = ['section', 'standard', 'indicator', 'description']
    readonly_fields = ['id', 'last_updated']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'project', 'section', 'standard', 'indicator', 'description', 'score')
        }),
        ('Assignment', {
            'fields': ('responsible_person', 'assignee', 'frequency')
        }),
        ('Status', {
            'fields': ('status', 'last_updated', 'notes')
        }),
        ('Additional Data', {
            'fields': ('form_schema', 'ai_analysis'),
            'classes': ('collapse',)
        }),
    )
    
    def indicator_short(self, obj):
        """Display shortened indicator text."""
        return obj.indicator[:50] + '...' if len(obj.indicator) > 50 else obj.indicator
    indicator_short.short_description = 'Indicator'
    
    def evidence_count(self, obj):
        """Display count of evidence."""
        return obj.evidence.count()
    evidence_count.short_description = 'Evidence'


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    """Admin interface for Evidence model."""
    
    list_display = [
        'file_name', 'type', 'indicator_short',
        'date_uploaded', 'sync_status', 'file_size'
    ]
    list_filter = ['type', 'sync_status', 'date_uploaded']
    search_fields = ['file_name', 'content', 'indicator__indicator']
    readonly_fields = ['id', 'date_uploaded']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'indicator', 'type', 'date_uploaded')
        }),
        ('File Details', {
            'fields': ('file_name', 'file', 'file_url', 'file_size', 'content')
        }),
        ('Google Drive Sync', {
            'fields': ('drive_file_id', 'drive_view_link', 'sync_status'),
            'classes': ('collapse',)
        }),
    )
    
    def indicator_short(self, obj):
        """Display shortened indicator text."""
        ind_text = obj.indicator.indicator
        return ind_text[:30] + '...' if len(ind_text) > 30 else ind_text
    indicator_short.short_description = 'Indicator'
