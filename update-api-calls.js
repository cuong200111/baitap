// Script to update all API calls to use Domain constant
import fs from 'fs';
import path from 'path';

// List of files that need to be updated
const filesToUpdate = [
  // App pages
  "app/category/[slug]/page.tsx",
  "app/checkout/page.tsx", 
  "app/thank-you/page.tsx",
  "app/cart/page.tsx",
  "app/test-menu/page.tsx",
  "app/test-search-filtering/page.tsx",
  "app/test-order-update/page.tsx",
  "app/admin/page.tsx",
  "app/admin/reports/page.tsx",
  "app/admin/shipping/page.tsx",
  "app/admin/orders/page.tsx",
  "app/admin/settings/page.tsx",
  "app/debug-auth/page.tsx",
  "app/register/page.tsx",
  "app/debug-featured/page.tsx",

  // Components
  "components/SeoStatusDashboard.tsx",
  "components/SeoSummaryStats.tsx",
  "components/SeoGenerationPanel.tsx",
  "components/EnhancedHeader.tsx",
  "components/CartPopup.tsx",
  "components/SeoSystemStatus.tsx",
  "components/SeoTestPanel.tsx",
  "components/Header.tsx",
  "components/AdvancedSeoDashboard.tsx",
  "components/HacomStyleMenu.tsx",
  "components/SimpleDbCategoryMenu.tsx",
  "components/SeoHead.tsx",
  "components/DebugCategoriesButton.tsx",
  "components/SimpleCategoryNav.tsx"
];

function updateApiCalls(filePath) {
  try {
    console.log(`Updating ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if Domain is already imported
    const importRegex = /import\s*{([^}]+)}\s*from\s*["']@\/config["']/;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      const imports = importMatch[1];
      if (!imports.includes('Domain')) {
        // Add Domain to existing imports
        const newImports = imports.trim() + ', Domain';
        content = content.replace(importRegex, `import { ${newImports} } from "@/config"`);
        modified = true;
        console.log(`  ✅ Added Domain import`);
      }
    } else {
      // Add Domain import if no config imports exist
      const hasOtherImports = content.includes('from "@/config"');
      if (!hasOtherImports) {
        // Find a good place to add the import (after other imports)
        const importSection = content.match(/(import.*?;\n)+/s);
        if (importSection) {
          const insertPoint = importSection[0].length;
          content = content.slice(0, insertPoint) + 'import { Domain } from "@/config";\n' + content.slice(insertPoint);
          modified = true;
          console.log(`  ✅ Added new Domain import`);
        }
      }
    }

    // Update all fetch calls
    const patterns = [
      // Basic fetch patterns
      { regex: /fetch\(\s*["'`]\/api\//g, replacement: 'fetch(`${Domain}/api/' },
      { regex: /fetch\(\s*`\/api\//g, replacement: 'fetch(`${Domain}/api/' },
      
      // robustFetch patterns
      { regex: /robustFetch\(\s*["'`]\/api\//g, replacement: 'robustFetch(`${Domain}/api/' },
      { regex: /robustFetch\(\s*`\/api\//g, replacement: 'robustFetch(`${Domain}/api/' },
      
      // fetchWithRetry patterns
      { regex: /fetchWithRetry\(\s*["'`]\/api\//g, replacement: 'fetchWithRetry(`${Domain}/api/' },
      { regex: /fetchWithRetry\(\s*`\/api\//g, replacement: 'fetchWithRetry(`${Domain}/api/' },
      
      // Template literal patterns that need fixing
      { regex: /`\/api\//g, replacement: '`${Domain}/api/' },
      { regex: /"\/api\//g, replacement: '`${Domain}/api/' },
      { regex: /'\/api\//g, replacement: '`${Domain}/api/' },
    ];

    patterns.forEach(({ regex, replacement }) => {
      const oldContent = content;
      content = content.replace(regex, replacement);
      if (content !== oldContent) {
        modified = true;
        console.log(`  ✅ Updated API calls with pattern: ${regex.source}`);
      }
    });

    // Fix any double template literals that might have been created
    content = content.replace(/`\${Domain}\/api\/([^`]+)`\s*\+\s*`([^`]*)`/g, '`${Domain}/api/$1$2`');
    
    // Fix closing quotes/backticks that might be wrong
    content = content.replace(/`\${Domain}\/api\/([^`"']*)"/, '`${Domain}/api/$1`');
    content = content.replace(/`\${Domain}\/api\/([^`"']*)'/, '`${Domain}/api/$1`');

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ File updated successfully`);
      return true;
    } else {
      console.log(`  ℹ️  No changes needed`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Starting API calls update...\n');
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  for (const file of filesToUpdate) {
    totalFiles++;
    if (updateApiCalls(file)) {
      updatedFiles++;
    }
    console.log('');
  }
  
  console.log('📊 SUMMARY:');
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Files updated: ${updatedFiles}`);
  console.log(`Files unchanged: ${totalFiles - updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log('\n✅ API calls update completed successfully!');
    console.log('All API calls now use the Domain constant for backend communication.');
  } else {
    console.log('\n💭 No files needed updating.');
  }
}

// Run the script
main();
