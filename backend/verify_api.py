#!/usr/bin/env python3
"""
Integration verification script for Django backend API.
Tests all endpoints match the frontend contract.
"""

import requests
import json
import sys
from datetime import datetime

API_BASE_URL = 'http://127.0.0.1:8000/api'
# Maximum length for truncated response text
RESPONSE_TRUNCATE_LENGTH = 200

def test_endpoint(method, endpoint, data=None, files=None, expected_status=200):
    """Test an API endpoint."""
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            if files:
                response = requests.post(url, data=data, files=files)
            else:
                response = requests.post(url, json=data)
        elif method == 'PATCH':
            response = requests.patch(url, json=data)
        elif method == 'DELETE':
            response = requests.delete(url)
        else:
            return False, f"Unknown method: {method}"
        
        success = response.status_code == expected_status
        
        return success, {
            'status_code': response.status_code,
            'expected': expected_status,
            'response': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:RESPONSE_TRUNCATE_LENGTH]
        }
    except Exception as e:
        return False, str(e)


def main():
    """Run all integration tests."""
    print("=" * 60)
    print("Django Backend Integration Verification")
    print("=" * 60)
    print(f"Testing API at: {API_BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    print()
    
    results = []
    
    # Test 1: List projects (GET /api/projects/)
    print("1. Testing GET /api/projects/")
    success, data = test_endpoint('GET', '/projects/')
    results.append(('GET /projects/', success))
    if success:
        print("   ✓ SUCCESS - Projects list retrieved")
    else:
        print(f"   ✗ FAILED - {data}")
    print()
    
    # Test 2: Create project (POST /api/projects/)
    print("2. Testing POST /api/projects/")
    project_data = {
        'name': 'Integration Test Project',
        'description': 'Test project for API verification',
        'indicators': [
            {
                'section': 'Security',
                'standard': 'ISO 27001',
                'indicator': 'Access Control',
                'description': 'Test evidence',
                'score': 10,
                'status': 'Not Started'
            }
        ]
    }
    success, data = test_endpoint('POST', '/projects/', project_data, expected_status=201)
    results.append(('POST /projects/', success))
    
    project_id = None
    indicator_id = None
    
    if success:
        print("   ✓ SUCCESS - Project created")
        project_id = data['response'].get('id')
        if project_id and data['response'].get('indicators'):
            indicator_id = data['response']['indicators'][0]['id']
            print(f"   Project ID: {project_id}")
            print(f"   Indicator ID: {indicator_id}")
    else:
        print(f"   ✗ FAILED - {data}")
    print()
    
    # Test 3: Update indicator (PATCH /api/indicators/<id>/)
    if indicator_id:
        print(f"3. Testing PATCH /api/indicators/{indicator_id}/")
        update_data = {
            'status': 'In Progress',
            'notes': 'Updated via integration test'
        }
        success, data = test_endpoint('PATCH', f'/indicators/{indicator_id}/', update_data)
        results.append(('PATCH /indicators/<id>/', success))
        if success:
            print("   ✓ SUCCESS - Indicator updated")
        else:
            print(f"   ✗ FAILED - {data}")
        print()
    
    # Test 4: Quick log indicator (POST /api/indicators/<id>/quick_log/)
    if indicator_id:
        print(f"4. Testing POST /api/indicators/{indicator_id}/quick_log/")
        success, data = test_endpoint('POST', f'/indicators/{indicator_id}/quick_log/')
        results.append(('POST /indicators/<id>/quick_log/', success))
        if success:
            print("   ✓ SUCCESS - Indicator quick logged")
        else:
            print(f"   ✗ FAILED - {data}")
        print()
    
    # Test 5: Add evidence (POST /api/evidence/)
    if indicator_id:
        print(f"5. Testing POST /api/evidence/ (note type)")
        evidence_data = {
            'indicator': indicator_id,
            'type': 'note',
            'file_name': 'Integration Test Note',
            'content': 'This is a test note from integration verification'
        }
        success, data = test_endpoint('POST', '/evidence/', evidence_data, expected_status=201)
        results.append(('POST /evidence/', success))
        if success:
            print("   ✓ SUCCESS - Evidence created")
        else:
            print(f"   ✗ FAILED - {data}")
        print()
    
    # Test 6: Connect Google Drive (POST /api/projects/<id>/connect_drive/)
    if project_id:
        print(f"6. Testing POST /api/projects/{project_id}/connect_drive/")
        drive_data = {
            'accountName': 'test@example.com',
            'rootFolderId': 'test-folder-123'
        }
        success, data = test_endpoint('POST', f'/projects/{project_id}/connect_drive/', drive_data)
        results.append(('POST /projects/<id>/connect_drive/', success))
        if success:
            print("   ✓ SUCCESS - Drive connected")
        else:
            print(f"   ✗ FAILED - {data}")
        print()
    
    # Test 7: Sync to Drive (POST /api/projects/<id>/sync_drive/)
    if project_id:
        print(f"7. Testing POST /api/projects/{project_id}/sync_drive/")
        success, data = test_endpoint('POST', f'/projects/{project_id}/sync_drive/')
        results.append(('POST /projects/<id>/sync_drive/', success))
        if success:
            print("   ✓ SUCCESS - Drive synced")
        else:
            print(f"   ✗ FAILED - {data}")
        print()
    
    # Test 8-14: AI Endpoints (all should work with graceful degradation)
    ai_endpoints = [
        ('POST /analyze-checklist/', '/analyze-checklist/', {'indicators': [{'section': 'Test', 'indicator': 'Test'}]}),
        ('POST /analyze-categorization/', '/analyze-categorization/', {'indicators': []}),
        ('POST /ask-assistant/', '/ask-assistant/', {'query': 'What is compliance?', 'indicators': []}),
        ('POST /report-summary/', '/report-summary/', {'indicators': []}),
        ('POST /convert-document/', '/convert-document/', {'document_text': 'Test document'}),
        ('POST /compliance-guide/', '/compliance-guide/', {'indicator': {'section': 'Test'}}),
        ('POST /analyze-tasks/', '/analyze-tasks/', {'indicators': []}),
    ]
    
    test_num = 8
    for name, endpoint, data in ai_endpoints:
        print(f"{test_num}. Testing {name}")
        success, result = test_endpoint('POST', endpoint, data)
        results.append((name, success))
        if success:
            print("   ✓ SUCCESS - AI endpoint responded (graceful degradation)")
        else:
            print(f"   ✗ FAILED - {result}")
        print()
        test_num += 1
    
    # Test 15: Delete project (DELETE /api/projects/<id>/)
    if project_id:
        print(f"15. Testing DELETE /api/projects/{project_id}/")
        success, data = test_endpoint('DELETE', f'/projects/{project_id}/', expected_status=204)
        results.append(('DELETE /projects/<id>/', success))
        if success:
            print("   ✓ SUCCESS - Project deleted")
        else:
            print(f"   ✗ FAILED - {data}")
        print()
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    total = len(results)
    passed = sum(1 for _, success in results if success)
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print()
    
    if failed > 0:
        print("Failed Tests:")
        for name, success in results:
            if not success:
                print(f"  ✗ {name}")
    
    print("=" * 60)
    
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
