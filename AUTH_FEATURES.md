# Authentication Features Guide

## Overview
The PinPoint Garage Connection Site now includes enhanced authentication features:

### 1. OTP (One-Time Password) Registration
Users can register using email verification with OTP codes.

**Flow:**
1. User enters email
2. System sends 6-digit OTP to email
3. User enters OTP, password, and selects role
4. Account is created after OTP verification

**Endpoints:**
- `POST /api/auth/request-otp-register` - Request OTP
- `POST /api/auth/register-with-otp` - Register with OTP verification

**Environment Variables:**
- `OTP_EXPIRY_MINUTES` - How long OTP is valid (default: 10 minutes)

### 2. Forgot Password
Users can reset their password via email link.

**Flow:**
1. User enters email
2. System sends password reset link to email (contains token)
3. User clicks link and enters new password
4. Password is updated

**Endpoints:**
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**Environment Variables:**
- `RESET_TOKEN_EXPIRY_HOURS` - How long reset token is valid (default: 1 hour)

### 3. Google OAuth Integration
Users can sign in using Google account.

**Setup Instructions:**

1. **Create Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials (Web Application)
   - Add authorized redirect URIs:
     - `http://localhost:5173` (development)
     - `http://localhost:5174` (development alternative)
     - `https://yourdomain.com` (production)

2. **Environment Variables:**
   - `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth Client ID (from Google Cloud Console)
   - `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth Client Secret (from Google Cloud Console)

3. **Frontend Integration:**
   - Install Google Sign-In library
   - Add Google Sign-In button in AuthDialog
   - Implement token verification

4. **Endpoint:**
   - `POST /api/auth/google-login` - Login with Google

### 4. Simple Password Registration
Users can still register with email and password (no OTP required).

**Endpoint:**
- `POST /api/auth/register` - Register with email and password

## Implementation Notes

### Database Schema
The auth system uses the following tables:
- `users` - Main user table with Google OAuth support
- `otp_codes` - Temporary OTP storage with expiration
- `password_reset_tokens` - Password reset tokens with expiration

### Email Service
Currently, OTP and password reset links are logged to console:
```
OTP for user@example.com: 123456
Password reset token for user@example.com: abc123def456...
```

For production, implement email service using:
- Nodemailer
- SendGrid
- AWS SES
- Mailgun

### Security Features
- Passwords are hashed with bcryptjs (10 rounds)
- OTP codes expire after configured time
- Reset tokens expire after configured time
- Secure httpOnly cookies for JWT tokens
- CORS protection for credential endpoints

## Testing Auth Features

### Using the UI
1. Click "Sign In" button in header
2. Choose registration method:
   - "Register with OTP" - Sends OTP to email
   - "Register Now" - Direct registration (no OTP)
3. For login, enter email and password
4. For forgot password, click "Forgot Password?" link

### Using API (curl examples)

**Request OTP:**
```bash
curl -X POST http://localhost:4000/api/auth/request-otp-register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Register with OTP:**
```bash
curl -X POST http://localhost:4000/api/auth/register-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"Password123",
    "otp":"123456",
    "role":"user"
  }'
```

**Forgot Password:**
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Reset Password:**
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"reset-token-from-email",
    "newPassword":"NewPassword123"
  }'
```

**Google Login:**
```bash
curl -X POST http://localhost:4000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@gmail.com",
    "googleId":"google-oauth-id",
    "name":"User Name"
  }'
```

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - Add TOTP support
   - Add SMS-based 2FA

2. **Social OAuth**
   - Add Facebook OAuth
   - Add GitHub OAuth
   - Add Twitter OAuth

3. **Session Management**
   - Add session tracking
   - Add device management
   - Add login history

4. **Account Security**
   - Add login alerts
   - Add suspicious activity detection
   - Add account recovery options

5. **Email Notifications**
   - Send welcome emails
   - Send login notifications
   - Send security alerts
