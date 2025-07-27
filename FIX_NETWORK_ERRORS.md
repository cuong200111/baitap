# 🔧 Fix Network Errors - Backend Connection Issues

## ❌ Current Problem

```
Error loading categories: Error: Network error
Login error: Error: Network error
Failed to load data: Error: Network error
```

## 🎯 Root Cause

The **backend server is not running** on port 4000, but the frontend is trying to make API calls to it.

## ✅ SOLUTION STEPS

### Step 1: Start Backend Server

```bash
# Open a new terminal
cd backend

# Install dependencies (if not already installed)
npm install

# Start backend development server
npm run dev
```

**Expected output:**

```
🚀 HACOM Backend API running on port 4000
📱 Health check: http://localhost:4000/api/health
```

### Step 2: Verify Backend is Running

Visit: http://localhost:4000/api/health

**Expected response:**

```json
{
  "success": true,
  "message": "HACOM Backend API is running"
}
```

### Step 3: Test Frontend Connection

Visit: http://localhost:8080/test-backend

This page will test the connection between frontend and backend.

## ✅ Already Fixed

### 1. ✅ Updated all API calls in config.ts

All API functions now use the `Domain` constant:

- `usersApi` ✅
- `productsApi` ✅
- `authApi` ✅
- `categoriesApi` ✅

### 2. ✅ Environment Configuration

- Created `.env.local` with `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`
- `Domain` constant now adapts to environment variables

### 3. ✅ Added Test Page

- `/test-backend` page for debugging backend connectivity

## 🚀 Running Both Servers

### Terminal 1 (Backend):

```bash
cd backend
npm run dev
# Runs on http://localhost:4000
```

### Terminal 2 (Frontend):

```bash
npm run dev
# Runs on http://localhost:8080
```

## 🔍 Debugging Steps

1. **Check Backend Health**: http://localhost:4000/api/health
2. **Test Frontend Connection**: http://localhost:8080/test-backend
3. **Check Categories**: http://localhost:4000/api/categories
4. **Check Products**: http://localhost:4000/api/products

## 🛠️ Common Issues

### Issue: "Connection refused"

- ✅ **Solution**: Start backend server (`cd backend && npm run dev`)

### Issue: "CORS error"

- ✅ **Fixed**: Backend already has CORS configured for localhost:8080

### Issue: "Database connection failed"

- ✅ **Check**: Backend `.env` file has correct database credentials
- ✅ **Run**: `cd backend && npm run db:migrate-new` to create tables

## 📊 Current Status

| Component | Status             | Port | Notes                          |
| --------- | ------------------ | ---- | ------------------------------ |
| Frontend  | ✅ Running         | 8080 | Next.js with updated API calls |
| Backend   | ❌ **NOT RUNNING** | 4000 | **NEEDS TO BE STARTED**        |
| Database  | ✅ Configured      | 3306 | MySQL with tables created      |

## 🎯 Next Steps

1. **START BACKEND SERVER** - This will fix all network errors
2. Test the `/test-backend` page
3. Verify login and categories work
4. Update remaining component API calls if needed

**Once backend is running, all network errors should be resolved!**
