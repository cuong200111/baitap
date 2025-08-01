#!/usr/bin/env node

// Simple test script to verify admin login works
const API_BASE = 'http://localhost:4000';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    // Test health check first
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData.message);
    
    // Test admin login
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@hacom.vn',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Admin login successful');
      console.log('Token:', loginData.data.token);
      
      // Test categories API with token
      const categoriesResponse = await fetch(`${API_BASE}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`
        }
      });
      
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categories API:', categoriesData.success ? 'Working' : 'Failed');
      console.log('Categories count:', categoriesData.data?.length || 0);
      
      // Test create category
      const createResponse = await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.data.token}`
        },
        body: JSON.stringify({
          name: 'Test Category ' + Date.now(),
          description: 'Test category created by script',
          sort_order: 999
        })
      });
      
      const createData = await createResponse.json();
      console.log('✅ Create category:', createData.success ? 'Working' : 'Failed');
      
      if (createData.success) {
        const categoryId = createData.data.id;
        
        // Test update category
        const updateResponse = await fetch(`${API_BASE}/api/categories/${categoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.data.token}`
          },
          body: JSON.stringify({
            name: 'Updated Test Category',
            description: 'Updated description'
          })
        });
        
        const updateData = await updateResponse.json();
        console.log('✅ Update category:', updateData.success ? 'Working' : 'Failed');
        
        // Test delete category
        const deleteResponse = await fetch(`${API_BASE}/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${loginData.data.token}`
          }
        });
        
        const deleteData = await deleteResponse.json();
        console.log('✅ Delete category:', deleteData.success ? 'Working' : 'Failed');
      }
      
    } else {
      console.log('❌ Admin login failed:', loginData.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminLogin();
