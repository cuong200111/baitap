# Authentication Setup Guide

## Overview

This application now has comprehensive authentication with secure registration, login, and admin role checking.

## Features Implemented

### 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt (salt rounds: 12)
- Role-based access control (admin/user)
- Input validation with express-validator
- Protected routes middleware
- Admin-only operations protection

### 🚀 Authentication Flow

1. **Registration**: Users can register with email, password, full name, and optional phone
2. **Login**: Email/password authentication with role checking
3. **Admin Access**: Only admin users can access `/admin` routes
4. **Token Management**: JWT tokens stored in localStorage with automatic verification

### 📱 Frontend Pages

- `/login` - Login page with error handling
- `/register` - Registration page with form validation
- `/admin/*` - Protected admin routes requiring admin role

### 🛡️ Backend Security

- All admin routes protected with `requireAdmin` middleware
- Password validation (minimum 6 characters)
- Email format validation
- Phone number validation (Vietnamese format)
- Active user checking

## Setup Instructions

### 1. Database Setup

Make sure MySQL is running and create the database:

```sql
CREATE DATABASE hacom_db;
USE hacom_db;
```

### 2. Run Database Migration

```bash
cd backend
npm run db:migrate
```

### 3. Create Admin Account

```bash
cd backend
npm run seed:admin
```

This creates an admin user:

- **Email**: admin@hacom.vn
- **Password**: admin123
- **Role**: admin

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

### 5. Start Frontend Server

```bash
npm run dev
```

## Testing Authentication

### Test Registration

1. Go to `/register`
2. Fill in the form:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Phone: "0912345678" (optional)
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Đăng ký"
4. Should redirect to `/admin` if successful

### Test Login

1. Go to `/login`
2. Use admin credentials:
   - Email: admin@hacom.vn
   - Password: admin123
3. Click "Đăng nhập"
4. Should redirect to `/admin` dashboard

### Test Admin Access

1. After logging in as admin, access:
   - `/admin` - Dashboard
   - `/admin/users` - User management
   - `/admin/products` - Product management
   - `/admin/categories` - Category management
   - `/admin/media` - Media library
   - `/admin/orders` - Order management

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/verify-token` - Verify JWT token

### Admin Protected Routes

- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Deactivate user (admin only)
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

## Environment Variables

Make sure these are set in `backend/.env`:

```env
# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=hacom_db
DB_PORT=3306
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Credentials**: Change the admin password after first login
2. **JWT Secret**: Use a strong, random JWT secret in production
3. **HTTPS**: Use HTTPS in production
4. **Rate Limiting**: Consider implementing rate limiting for login attempts
5. **Password Policy**: Enforce stronger password policies in production
6. **Session Management**: Implement proper session management and logout

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **JWT Token Invalid**

   - Check JWT_SECRET in backend/.env
   - Clear localStorage and re-login

3. **Admin Access Denied**

   - Ensure user has 'admin' role in database
   - Check token is being sent with requests

4. **CORS Errors**
   - Verify backend CORS configuration
   - Check API base URL in frontend config

### Reset Admin Password

If you forget the admin password, run this SQL query:

```sql
UPDATE users
SET password = '$2a$12$hash_of_new_password'
WHERE email = 'admin@hacom.vn';
```

Or re-run the seed script:

```bash
cd backend
npm run seed:admin
```
