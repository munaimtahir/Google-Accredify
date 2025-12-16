"""
Django REST Framework serializers for AccrediFy API.
"""

from rest_framework import serializers
from .models import Project, Indicator, Evidence


class EvidenceSerializer(serializers.ModelSerializer):
    """Serializer for Evidence model."""
    
    # Custom fields to match frontend expectations
    dateUploaded = serializers.DateTimeField(source='date_uploaded', read_only=True)
    fileName = serializers.CharField(source='file_name', required=False, allow_blank=True)
    fileUrl = serializers.URLField(source='file_url', required=False, allow_blank=True)
    fileSize = serializers.CharField(source='file_size', required=False, allow_blank=True)
    driveFileId = serializers.CharField(source='drive_file_id', required=False, allow_blank=True)
    driveViewLink = serializers.URLField(source='drive_view_link', required=False, allow_blank=True)
    syncStatus = serializers.CharField(source='sync_status', read_only=True)
    
    class Meta:
        model = Evidence
        fields = [
            'id', 'dateUploaded', 'type', 'fileName', 'fileUrl', 
            'content', 'fileSize', 'driveFileId', 'driveViewLink', 'syncStatus'
        ]
        read_only_fields = ['id', 'dateUploaded', 'syncStatus']
    
    def create(self, validated_data):
        """Create evidence with file handling."""
        # Handle file upload
        file = self.context.get('request').FILES.get('file')
        if file:
            validated_data['file'] = file
            validated_data['file_name'] = validated_data.get('file_name') or file.name
            validated_data['file_size'] = f"{file.size / 1024:.2f} KB"
        
        return super().create(validated_data)


class IndicatorSerializer(serializers.ModelSerializer):
    """Serializer for Indicator model."""
    
    # Nested evidence serializer (read-only)
    evidence = EvidenceSerializer(many=True, read_only=True)
    
    # Custom fields to match frontend expectations
    responsiblePerson = serializers.CharField(
        source='responsible_person', 
        required=False, 
        allow_blank=True,
        allow_null=True
    )
    lastUpdated = serializers.DateField(source='last_updated', read_only=True)
    formSchema = serializers.JSONField(source='form_schema', required=False, allow_null=True)
    aiAnalysis = serializers.JSONField(source='ai_analysis', required=False, allow_null=True)
    
    class Meta:
        model = Indicator
        fields = [
            'id', 'section', 'standard', 'indicator', 'description', 
            'score', 'responsiblePerson', 'frequency', 'assignee', 
            'status', 'evidence', 'notes', 'lastUpdated', 'formSchema', 'aiAnalysis'
        ]
        read_only_fields = ['id', 'lastUpdated', 'evidence']
    
    def validate_score(self, value):
        """Ensure score is positive."""
        if value < 0:
            raise serializers.ValidationError("Score must be a positive number")
        return value


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""
    
    # Nested indicators with evidence
    indicators = IndicatorSerializer(many=True, read_only=True)
    
    # Custom fields to match frontend expectations
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    driveConfig = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'indicators', 'createdAt', 'driveConfig']
        read_only_fields = ['id', 'createdAt']
    
    def get_driveConfig(self, obj):
        """Get Google Drive configuration."""
        return {
            'isConnected': obj.drive_is_connected,
            'accountName': obj.drive_account_name,
            'rootFolderId': obj.drive_root_folder_id,
            'lastSync': obj.drive_last_sync.isoformat() if obj.drive_last_sync else None
        }


class IndicatorCreateSerializer(serializers.Serializer):
    """Serializer for creating indicators during project creation."""
    
    section = serializers.CharField()
    standard = serializers.CharField()
    indicator = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    score = serializers.IntegerField(default=10)
    responsiblePerson = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    frequency = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    assignee = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    status = serializers.CharField(default='Not Started')


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating projects with indicators."""
    
    indicators = IndicatorCreateSerializer(many=True, required=False)
    
    class Meta:
        model = Project
        fields = ['name', 'description', 'indicators']
    
    def create(self, validated_data):
        """Create project with associated indicators."""
        indicators_data = validated_data.pop('indicators', [])
        project = Project.objects.create(**validated_data)
        
        # Create indicators
        for indicator_data in indicators_data:
            # Convert camelCase to snake_case
            Indicator.objects.create(
                project=project,
                section=indicator_data.get('section', ''),
                standard=indicator_data.get('standard', ''),
                indicator=indicator_data.get('indicator', ''),
                description=indicator_data.get('description', ''),
                score=indicator_data.get('score', 10),
                responsible_person=indicator_data.get('responsiblePerson'),
                frequency=indicator_data.get('frequency'),
                assignee=indicator_data.get('assignee'),
                status=indicator_data.get('status', 'Not Started')
            )
        
        return project
