# Admin Login Credentials

## Authentication Update

✅ **Email/Password authentication is now enabled for admin login!**

Google OAuth has been replaced with traditional email/password authentication for better control and security.

## Login Credentials

### Admin Account
- **Email**: `admin@invertis.edu.in`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: Can upload, edit, and delete PYQ papers

### Super Admin Account
- **Email**: `superadmin@invertis.edu.in`
- **Password**: `super123`
- **Role**: Super Admin
- **Access**: Full system access including department/branch/session management

### Test Student Account
- **Email**: `test@invertis.edu.in`
- **Password**: `test123`
- **Role**: Student
- **Access**: Can browse and download PYQ papers

## How to Seed Admin Accounts

Run this command in the `server` directory:

```bash
npm run seed:admins
```

This will:
- Create new admin/super-admin/student accounts
- Update existing accounts with passwords if they don't have one
- Display all login credentials in the terminal

## Database Changes

### User Model Updates
- ✅ Added `password` field (optional, hashed with bcrypt)
- ✅ Made `googleId` optional (sparse unique index)
- ✅ Both Google OAuth and email/password authentication now supported

### New API Endpoint
- **POST** `/api/auth/login` - Email/password login
  ```json
  {
    "email": "admin@invertis.edu.in",
    "password": "admin123"
  }
  ```

### Response
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "admin@invertis.edu.in",
    "name": "Admin User",
    "role": "admin",
    "picture": null
  }
}
```

## Frontend Updates

The admin login page (`/admin`) now displays:
- Email input field
- Password input field
- Login button with loading state
- Error messages
- Demo credentials info box

## Testing

1. **Start the backend**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd client
   npm run dev
   ```

3. **Navigate to**: `http://localhost:3000/admin`

4. **Login with**:
   - Email: `admin@invertis.edu.in`
   - Password: `admin123`

5. **You should be redirected to**: `/admin/dashboard`

## Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT token-based authentication
- ✅ Role-based access control
- ✅ Protected routes with middleware
- ✅ Input validation

## Migration Notes

- Existing Google OAuth users are not affected
- Google OAuth still works for `/api/auth/google` endpoint
- Email/password users get a unique googleId in format: `email_{email}`
- This prevents conflicts with MongoDB unique index

## File Changes

### Backend
- ✅ `server/src/utils/seedAdmins.ts` - New admin seeding script
- ✅ `server/src/models/User.ts` - Added password field, made googleId optional
- ✅ `server/src/types/index.ts` - Updated IUser interface
- ✅ `server/src/controllers/authController.ts` - Added emailLogin function
- ✅ `server/src/routes/auth.ts` - Added POST /api/auth/login route
- ✅ `server/package.json` - Added seed:admins script

### Frontend
- ✅ `client/src/app/admin/page.tsx` - Replaced Google OAuth with email/password form

## Future Enhancements

- [ ] Add "Forgot Password" functionality
- [ ] Add "Change Password" feature for logged-in users
- [ ] Add email verification for new accounts
- [ ] Add 2FA (Two-Factor Authentication) option
- [ ] Add password strength requirements
- [ ] Add account lockout after failed attempts
