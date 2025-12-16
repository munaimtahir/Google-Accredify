"""
Django models for AccrediFy compliance management platform.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Project(models.Model):
    """Compliance project model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    # Google Drive configuration
    drive_is_connected = models.BooleanField(default=False)
    drive_account_name = models.CharField(max_length=255, blank=True, null=True)
    drive_root_folder_id = models.CharField(max_length=255, blank=True, null=True)
    drive_last_sync = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'projects'
    
    def __str__(self):
        return self.name


class Indicator(models.Model):
    """Compliance indicator/requirement model."""
    
    STATUS_CHOICES = [
        ('Not Started', 'Not Started'),
        ('In Progress', 'In Progress'),
        ('Compliant', 'Compliant'),
        ('Non-Compliant', 'Non-Compliant'),
        ('Not Applicable', 'Not Applicable'),
    ]
    
    FREQUENCY_CHOICES = [
        ('One-time', 'One-time'),
        ('Daily', 'Daily'),
        ('Weekly', 'Weekly'),
        ('Monthly', 'Monthly'),
        ('Quarterly', 'Quarterly'),
        ('Annually', 'Annually'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='indicators'
    )
    
    # Compliance fields
    section = models.CharField(max_length=255)
    standard = models.CharField(max_length=255)
    indicator = models.TextField()
    description = models.TextField(blank=True)
    score = models.IntegerField(default=10)
    
    # Assignment and tracking
    responsible_person = models.CharField(max_length=255, blank=True, null=True)
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        blank=True,
        null=True
    )
    assignee = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Not Started'
    )
    
    # Additional data
    notes = models.TextField(blank=True, null=True)
    last_updated = models.DateField(auto_now=True)
    form_schema = models.JSONField(blank=True, null=True)
    ai_analysis = models.JSONField(blank=True, null=True)
    
    class Meta:
        ordering = ['section', 'standard', 'indicator']
        db_table = 'indicators'
    
    def __str__(self):
        return f"{self.section} - {self.indicator[:50]}"


class Evidence(models.Model):
    """Evidence/attachment model for compliance indicators."""
    
    TYPE_CHOICES = [
        ('document', 'Document'),
        ('image', 'Image'),
        ('certificate', 'Certificate'),
        ('note', 'Note'),
        ('link', 'Link'),
    ]
    
    SYNC_STATUS_CHOICES = [
        ('synced', 'Synced'),
        ('pending', 'Pending'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    indicator = models.ForeignKey(
        Indicator,
        on_delete=models.CASCADE,
        related_name='evidence'
    )
    
    # Evidence details
    date_uploaded = models.DateTimeField(default=timezone.now)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='evidence/%Y/%m/', blank=True, null=True)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    content = models.TextField(blank=True, null=True)  # For notes
    file_size = models.CharField(max_length=50, blank=True, null=True)
    
    # Google Drive sync
    drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    drive_view_link = models.URLField(max_length=500, blank=True, null=True)
    sync_status = models.CharField(
        max_length=20,
        choices=SYNC_STATUS_CHOICES,
        default='pending'
    )
    
    class Meta:
        ordering = ['-date_uploaded']
        db_table = 'evidence'
        verbose_name_plural = 'evidence'
    
    def __str__(self):
        return f"{self.type} - {self.file_name or 'Unnamed'}"
