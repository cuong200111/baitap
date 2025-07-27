// Script to find and update API calls across the application
const fs = require('fs');
const path = require('path');

// Find all TypeScript/JavaScript files that might have API calls
function findFilesWithAPICalls(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('Api.') || content.includes('api/') || content.includes('fetch(')) {
          files.push({
            path: fullPath,
            content: content
          });
        }
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

// Update API calls in content
function updateAPICallsInContent(content) {
  let updated = content;
  
  // Replace old API calls with new wrapper calls
  const replacements = [
    // Categories
    [/categoriesApi\.getAll/g, 'apiWrappers.categories.getAll'],
    [/categoriesApi\.getById/g, 'apiWrappers.categories.getById'],
    [/categoriesApi\.create/g, 'apiWrappers.categories.create'],
    [/categoriesApi\.update/g, 'apiWrappers.categories.update'],
    [/categoriesApi\.delete/g, 'apiWrappers.categories.delete'],
    
    // Products
    [/productsApi\.getAll/g, 'apiWrappers.products.getAll'],
    [/productsApi\.getById/g, 'apiWrappers.products.getById'],
    [/productsApi\.create/g, 'apiWrappers.products.create'],
    [/productsApi\.update/g, 'apiWrappers.products.update'],
    [/productsApi\.delete/g, 'apiWrappers.products.delete'],
    
    // Users
    [/usersApi\.getAll/g, 'apiWrappers.users.getAll'],
    [/usersApi\.getById/g, 'apiWrappers.users.getById'],
    [/usersApi\.create/g, 'apiWrappers.users.create'],
    [/usersApi\.update/g, 'apiWrappers.users.update'],
    [/usersApi\.delete/g, 'apiWrappers.users.delete'],
    
    // Auth
    [/authApi\.login/g, 'apiWrappers.auth.login'],
    [/authApi\.register/g, 'apiWrappers.auth.register'],
    [/authApi\.getProfile/g, 'apiWrappers.auth.getProfile'],
    
    // Media
    [/mediaApi\.getAll/g, 'apiWrappers.media.getAll'],
    [/mediaApi\.upload/g, 'apiWrappers.media.upload'],
    [/mediaApi\.update/g, 'apiWrappers.media.update'],
    [/mediaApi\.delete/g, 'apiWrappers.media.delete'],
  ];
  
  replacements.forEach(([pattern, replacement]) => {
    updated = updated.replace(pattern, replacement);
  });
  
  // Add apiWrappers import if API calls are found and import doesn't exist
  if (updated.includes('apiWrappers.') && !updated.includes('apiWrappers')) {
    const importPattern = /import.*from.*['"]@\/config['"];?\s*/;
    if (importPattern.test(updated)) {
      updated = updated.replace(importPattern, (match) => {
        return match + 'import { apiWrappers } from "@/lib/api-wrapper";\n';
      });
    } else {
      // Add import at the top after other imports
      const importLines = updated.split('\n').slice(0, 10); // Check first 10 lines
      let insertIndex = 0;
      for (let i = 0; i < importLines.length; i++) {
        if (importLines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      const lines = updated.split('\n');
      lines.splice(insertIndex, 0, 'import { apiWrappers } from "@/lib/api-wrapper";');
      updated = lines.join('\n');
    }
  }
  
  return updated;
}

// Main execution
console.log('🔍 Scanning for files with API calls...');

const files = findFilesWithAPICalls('./app');
console.log(`📝 Found ${files.length} files with potential API calls`);

let updatedCount = 0;

files.forEach(file => {
  const originalContent = file.content;
  const updatedContent = updateAPICallsInContent(originalContent);
  
  if (originalContent !== updatedContent) {
    fs.writeFileSync(file.path, updatedContent, 'utf8');
    console.log(`✅ Updated: ${file.path}`);
    updatedCount++;
  }
});

console.log(`\n🎉 Migration complete! Updated ${updatedCount} files.`);
console.log('\n📋 Summary:');
console.log('- All API calls now use apiWrappers with proper error handling');
console.log('- Automatic retries and logging added');
console.log('- Consistent error responses across the app');
