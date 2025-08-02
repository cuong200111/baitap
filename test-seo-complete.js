#!/usr/bin/env node

/**
 * Complete SEO System Test
 * Tests all SEO-related functionality including Advanced SEO Dashboard
 */

const API_BASE = "http://localhost:4000";

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`🔗 Testing: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-admin-token', // We'll use a test token
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${endpoint}: ${response.status} - ${data.success ? 'Success' : data.message || 'Failed'}`);
    
    if (data.success && data.data) {
      console.log(`   📊 Data keys: ${Object.keys(data.data).join(', ')}`);
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${endpoint}: Network Error - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSeoEndpoints() {
  console.log('🧪 Testing All SEO Endpoints...\n');

  // Test basic endpoints
  await makeRequest('/api/health');
  
  // Test SEO Status endpoints
  console.log('\n📊 SEO Status & Analytics:');
  await makeRequest('/api/admin/seo-status');
  await makeRequest('/api/admin/seo-settings');
  await makeRequest('/api/admin/seo-audit');
  
  // Test Advanced SEO Dashboard endpoints
  console.log('\n🤖 Advanced SEO Dashboard:');
  await makeRequest('/api/admin/seo-performance?range=30d&competitors=true');
  await makeRequest('/api/admin/seo-ai-recommendations', { method: 'POST', body: JSON.stringify({ analysisType: 'all', timeframe: '30d' }) });
  
  // Test Content Analysis
  console.log('\n📝 Content Analysis:');
  await makeRequest('/api/admin/seo-content-analysis', {
    method: 'POST',
    body: JSON.stringify({
      content: '<h1>Test Content</h1><p>This is a test content for SEO analysis with gaming laptop keywords.</p>',
      targetKeywords: ['gaming', 'laptop', 'computer'],
      pageType: 'custom'
    })
  });
  
  // Test SEO Settings Save
  console.log('\n⚙️ SEO Settings:');
  await makeRequest('/api/admin/seo-settings', {
    method: 'POST',
    body: JSON.stringify({
      general: {
        site_name: 'HACOM Test',
        site_description: 'Test description',
        site_url: 'https://test.hacom.vn'
      }
    })
  });
  
  // Test File Generation
  console.log('\n📄 File Generation:');
  await makeRequest('/api/admin/generate-sitemap', { method: 'POST' });
  await makeRequest('/api/admin/generate-robots', { method: 'POST' });
  
  // Test Bulk Operations
  console.log('\n🔄 Bulk Operations:');
  await makeRequest('/api/admin/seo-bulk-update');
  await makeRequest('/api/admin/seo-auto-fix', { method: 'POST', body: JSON.stringify({ issues: ['missing_alt_text', 'missing_meta_description'] }) });
  await makeRequest('/api/admin/seo-test-all');
  
  console.log('\n✅ SEO Endpoint Testing Complete!');
}

// Test frontend components
async function testFrontendComponents() {
  console.log('\n🎨 Testing Frontend Components...');
  
  const frontendTests = [
    'Advanced SEO Dashboard loads without errors',
    'SEO Status Dashboard displays correctly',
    'SEO Settings tabs work properly',
    'Content Analysis form functions',
    'Performance metrics display',
    'AI Recommendations render'
  ];
  
  frontendTests.forEach((test, i) => {
    console.log(`${i + 1}. ${test}: ✅ (Manual verification required)`);
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Complete SEO System Test\n');
  console.log('=' .repeat(50));
  
  await testSeoEndpoints();
  await testFrontendComponents();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 All SEO Tests Completed!\n');
  
  console.log('📋 Manual Verification Checklist:');
  console.log('  □ Visit http://localhost:3000/admin/settings');
  console.log('  □ Check "SEO" tab loads without errors');
  console.log('  □ Check "SEO Status" tab displays data');
  console.log('  □ Check "Advanced SEO" tab works');
  console.log('  □ Test content analysis form');
  console.log('  □ Verify performance metrics display');
  console.log('  □ Check all sub-tabs (Analytics, Social, etc.)');
  console.log('  □ Test saving SEO settings');
  console.log('  □ Verify notifications appear correctly');
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { makeRequest, testSeoEndpoints };
