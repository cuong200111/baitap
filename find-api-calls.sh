#!/bin/bash

echo "🔍 Finding all API calls that need to be updated..."
echo "=================================================="

# Find all files with /api/ calls excluding app/api and backend folders
grep -r -n --include="*.tsx" --include="*.ts" --exclude-dir="app/api" --exclude-dir="backend" --exclude-dir="node_modules" "fetch.*['\"`]/api/" . | head -20

echo ""
echo "📝 These files need Domain import and API call updates."
echo "Update pattern: '/api/' → '\${Domain}/api/'"
