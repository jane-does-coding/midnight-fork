# Login Page API Documentation

This document describes how the `/login` page interacts with the backend API endpoints, including the data it sends and receives.

## Overview

The login page (`/Users/leafd/HackClub/midnight/lark-ui/src/routes/login/+page.svelte`) is a comprehensive authentication and project management interface that handles:

1. **Authentication Flow**: Email-based OTP authentication
2. **Profile Management**: User profile completion for new users
3. **Project Management**: Creating and managing projects
4. **Submission Management**: Creating submissions for projects
5. **Onboarding**: Testing onboarding completion status

## API Base Configuration

```typescript
const API_BASE = 'http://localhost:3002';
```

All API calls include `credentials: 'include'` to maintain session cookies.

## Authentication Endpoints

### 1. Check Authentication Status

**Endpoint**: `GET /api/user/auth/me`

**Purpose**: Check if user is currently authenticated

**Request**:
- Method: GET
- Headers: `credentials: 'include'`
- No body required

**Response**:
```typescript
// Success (200)
{
  userId: string;
  email: string;
  username: string;
  name: string;
  birthday: Date;
  role: string;
  onboardComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Error (401)
{
  message: string;
}
```

**Frontend Usage**:
```typescript
async function checkAuthStatus() {
  const response = await fetch(`${API_BASE}/api/user/auth/me`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    const userData = await response.json();
    user = userData;
    step = 'dashboard';
  }
}
```

### 2. Request OTP

**Endpoint**: `POST /api/user/auth/login`

**Purpose**: Send OTP to user's email for authentication

**Request**:
```typescript
{
  email: string; // Valid email address
}
```

**Response**:
```typescript
// Success (200)
{
  message: "OTP sent to your email";
  sessionId: string;
}

// Error (400/500)
{
  message: string;
}
```

**Frontend Usage**:
```typescript
async function sendOtp() {
  const response = await fetch(`${API_BASE}/api/user/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email })
  });
}
```

### 3. Verify OTP

**Endpoint**: `POST /api/user/auth/verify-otp`

**Purpose**: Verify the OTP code and complete authentication

**Request**:
```typescript
{
  email: string;    // Same email used in login
  otp: string;      // 6-digit OTP code
}
```

**Response**:
```typescript
// Success - Existing User (200)
{
  message: "OTP verified successfully";
  user: {
    userId: string;
    email: string;
    username: string;
    name: string;
  };
  sessionId: string;
}

// Success - New User (200)
{
  message: "OTP verified. Please complete your profile.";
  sessionId: string;
  isNewUser: true;
  email: string;
}

// Error (401)
{
  message: "Invalid or expired OTP";
}
```

**Cookies Set**:
- `sessionId`: HTTP-only cookie for session management
- `email`: HTTP-only cookie for new users (10 minutes expiry)

**Frontend Usage**:
```typescript
async function verifyOtp() {
  const response = await fetch(`${API_BASE}/api/user/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, otp })
  });
  
  if (response.ok) {
    if (data.user) {
      user = data.user;
      step = 'dashboard';
    } else if (data.isNewUser) {
      step = 'profile';
    }
  }
}
```

### 4. Complete Profile

**Endpoint**: `POST /api/user/auth/complete-profile`

**Purpose**: Complete user profile for new users

**Request**:
```typescript
{
  username: string;  // Minimum 3 characters
  name: string;      // Full name
  birthday: string;  // ISO date string (YYYY-MM-DD)
}
```

**Response**:
```typescript
// Success (200)
{
  message: "Profile completed successfully";
  user: {
    userId: string;
    email: string;
    username: string;
    name: string;
  };
}

// Error (400/401)
{
  message: string;
}
```

**Frontend Usage**:
```typescript
async function completeProfile() {
  const response = await fetch(`${API_BASE}/api/user/auth/complete-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, name, birthday })
  });
}
```

### 5. Logout

**Endpoint**: `POST /api/user/auth/logout`

**Purpose**: End user session

**Request**:
- Method: POST
- Headers: `credentials: 'include'`
- No body required

**Response**:
```typescript
{
  message: "Logged out successfully";
}
```

**Cookies Cleared**:
- `sessionId`
- `email`

**Frontend Usage**:
```typescript
async function logout() {
  await fetch(`${API_BASE}/api/user/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  
  // Reset all state
  step = 'login';
  user = null;
  // ... clear all form fields
}
```

## Onboarding Endpoints

### 6. Complete Onboarding

**Endpoint**: `POST /api/user/auth/complete-onboarding`

**Purpose**: Mark user onboarding as complete

**Request**:
- Method: POST
- Headers: `credentials: 'include'`
- No body required

**Response**:
```typescript
// Success (200)
{
  message: "Onboarding completed successfully";
  user: {
    userId: string;
    email: string;
    username: string;
    name: string;
    onboardComplete: boolean;
  };
}
```

### 7. Get Onboarding Status

**Endpoint**: `GET /api/user/auth/onboarding-status`

**Purpose**: Check if user has completed onboarding

**Request**:
- Method: GET
- Headers: `credentials: 'include'`
- No body required

**Response**:
```typescript
// Success (200)
{
  onboardComplete: boolean;
}
```

## Project Management Endpoints

### 8. Create Project

**Endpoint**: `POST /api/projects/auth`

**Purpose**: Create a new project for the authenticated user

**Request**:
```typescript
{
  projectName: string;  // Required
  projectType: string; // Required
}
```

**Response**:
```typescript
// Success (200)
{
  projectId: string;
  userId: string;
  projectName: string;
  projectType: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    userId: string;
    username: string;
    name: string;
  };
}
```

**Frontend Usage**:
```typescript
async function createProject() {
  const response = await fetch(`${API_BASE}/api/projects/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ projectName, projectType })
  });
}
```

### 9. Get User Projects

**Endpoint**: `GET /api/projects/auth`

**Purpose**: Retrieve all projects for the authenticated user

**Request**:
- Method: GET
- Headers: `credentials: 'include'`
- No body required

**Response**:
```typescript
// Success (200)
[
  {
    projectId: string;
    userId: string;
    projectName: string;
    projectType: string;
    createdAt: Date;
    updatedAt: Date;
    submissions: [
      {
        submissionId: string;
        projectId: string;
        playableUrl: string | null;
        imageUrl: string | null;
        description: string | null;
        repoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    ];
  }
]
```

### 10. Get Project Details

**Endpoint**: `GET /api/projects/auth/:id`

**Purpose**: Get specific project details

**Request**:
- Method: GET
- Headers: `credentials: 'include'`
- URL Parameter: `id` (projectId)

**Response**:
```typescript
// Success (200)
{
  projectId: string;
  userId: string;
  projectName: string;
  projectType: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    userId: string;
    username: string;
    name: string;
  };
  submissions: [
    {
      submissionId: string;
      projectId: string;
      playableUrl: string | null;
      imageUrl: string | null;
      description: string | null;
      repoUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  ];
}
```

## Submission Management Endpoints

### 11. Create Submission

**Endpoint**: `POST /api/projects/auth/submissions`

**Purpose**: Create a submission for a project

**Request**:
```typescript
{
  projectId: string;        // Required
  playableUrl?: string;    // Optional URL
  imageUrl?: string;       // Optional URL
  description?: string;     // Optional text
  repoUrl?: string;        // Optional URL
}
```

**Response**:
```typescript
// Success (200)
{
  submissionId: string;
  projectId: string;
  playableUrl: string | null;
  imageUrl: string | null;
  description: string | null;
  repoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Frontend Usage**:
```typescript
async function createSubmission() {
  const response = await fetch(`${API_BASE}/api/projects/auth/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ 
      projectId: selectedProjectId,
      playableUrl: playableUrl || undefined,
      imageUrl: imageUrl || undefined,
      description: description || undefined,
      repoUrl: repoUrl || undefined
    })
  });
}
```

### 12. Get Project Submissions

**Endpoint**: `GET /api/projects/auth/:id/submissions`

**Purpose**: Get all submissions for a specific project

**Request**:
- Method: GET
- Headers: `credentials: 'include'`
- URL Parameter: `id` (projectId)

**Response**:
```typescript
// Success (200)
[
  {
    submissionId: string;
    projectId: string;
    playableUrl: string | null;
    imageUrl: string | null;
    description: string | null;
    repoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
]
```

## Authentication Flow

The login page implements a multi-step authentication flow:

1. **Initial State**: User enters email
2. **OTP Request**: System sends OTP to email
3. **OTP Verification**: User enters OTP code
4. **Profile Completion** (New Users): User completes profile with username, name, birthday
5. **Dashboard**: User can create projects and submissions

## Session Management

- **Session Cookies**: HTTP-only cookies maintain authentication state
- **Session Expiry**: 24 hours for main session, 10 minutes for email cookie
- **Security**: Cookies are secure in production, sameSite: 'lax' for cross-origin support

## Error Handling

All endpoints return consistent error responses:
```typescript
{
  message: string; // Human-readable error message
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid session/OTP)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `500`: Internal Server Error

## Frontend State Management

The login page maintains the following state variables:

```typescript
// Form data
let email = '';
let otp = '';
let username = '';
let name = '';
let birthday = '';
let projectName = '';
let projectType = '';
let playableUrl = '';
let imageUrl = '';
let description = '';
let repoUrl = '';

// Application state
let step = 'login'; // login, otp, profile, dashboard
let user = null;
let projects = [];
let selectedProjectId = '';
let submissions = [];

// UI state
let loading = false;
let message = '';
let error = '';
```

## Security Considerations

1. **OTP Expiry**: OTP codes expire after 10 minutes
2. **Session Management**: HTTP-only cookies prevent XSS attacks
3. **Input Validation**: All inputs are validated on both client and server
4. **CORS**: Credentials are included for cross-origin requests
5. **Temporary Users**: New users are created with temporary data until profile completion
