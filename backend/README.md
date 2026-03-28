# The БЫК App - Backend API

Node.js + Express backend for The БЫК App restaurant staff learning tool.

## Features

- **User Authentication**: Registration and login with JWT tokens
- **Learning Progress Tracking**: Store and retrieve user learning progress per module
- **Promo Code System**: Generate, validate, and redeem promo codes
- **Admin Panel**: Manage users, view progress, and generate promo codes
- **SQLite Database**: Lightweight, file-based database for easy deployment

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/app.db
JWT_SECRET=your_super_secret_key
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
```

## Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start at `http://localhost:3001`

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "role": "waiter"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "waiter"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}

Response:
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "waiter"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Profile

#### Get Profile
```
GET /api/users/profile
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "waiter",
  "created_at": "2024-03-28T12:00:00Z"
}
```

#### Update Profile
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}

Response:
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "waiter"
  }
}
```

### Learning Progress

#### Save Progress
```
POST /api/learning/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "moduleId": "menu",
  "score": 85
}

Response:
{
  "message": "Progress saved successfully",
  "progress": {
    "id": 1,
    "user_id": 1,
    "module_id": "menu",
    "score": 85,
    "completed_at": "2024-03-28T12:00:00Z",
    "created_at": "2024-03-28T12:00:00Z",
    "updated_at": "2024-03-28T12:00:00Z"
  }
}
```

#### Get Progress
```
GET /api/learning/progress
Authorization: Bearer <token>

Response:
{
  "progress": [
    {
      "id": 1,
      "user_id": 1,
      "module_id": "menu",
      "score": 85,
      "completed_at": "2024-03-28T12:00:00Z"
    }
  ],
  "summary": {
    "avgScore": 85,
    "modulesCompleted": 1,
    "allModulesCompleted": false
  }
}
```

### Promo Codes

#### Redeem Promo Code
```
POST /api/promo/redeem
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "BULL-ABC1-2024"
}

Response:
{
  "message": "Promo code redeemed successfully",
  "code": "BULL-ABC1-2024",
  "type": "learning_reward"
}
```

#### Get User Promo Codes
```
GET /api/promo/codes
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "code": "BULL-ABC1-2024",
    "type": "learning_reward",
    "used": false,
    "expires_at": null,
    "created_at": "2024-03-28T12:00:00Z"
  }
]
```

### Admin Endpoints

#### Get All Users (Admin only)
```
GET /api/users
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "waiter",
    "created_at": "2024-03-28T12:00:00Z"
  }
]
```

#### Get All Progress (Manager/Admin)
```
GET /api/learning/progress/all
Authorization: Bearer <manager_token>

Response:
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "waiter",
    "modules": [
      {
        "moduleId": "menu",
        "score": 85,
        "completedAt": "2024-03-28T12:00:00Z"
      }
    ]
  }
]
```

#### Create Promo Code (Admin only)
```
POST /api/promo/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 1,
  "type": "manual",
  "expiresAt": "2024-12-31T23:59:59Z"
}

Response:
{
  "message": "Promo code created successfully",
  "promoCode": {
    "id": 1,
    "code": "BULL-XYZ9-2024",
    "user_id": 1,
    "type": "manual",
    "used": false,
    "expires_at": "2024-12-31T23:59:59Z",
    "created_at": "2024-03-28T12:00:00Z"
  }
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'waiter' CHECK(role IN ('waiter', 'manager', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Learning Progress Table
```sql
CREATE TABLE learning_progress (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  module_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, module_id)
)
```

### Promo Codes Table
```sql
CREATE TABLE promo_codes (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('learning_reward', 'manual')),
  used BOOLEAN DEFAULT 0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK(tier IN ('basic', 'standard', 'premium')),
  active BOOLEAN DEFAULT 1,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request creating a resource
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Security

- Passwords are hashed using bcryptjs (10 salt rounds)
- JWT tokens expire after 7 days (configurable)
- All protected routes require valid JWT token
- Admin routes require admin role
- Manager routes require manager or admin role
- CORS is configured to allow only specified origins

## Development

For development with auto-reload:

```bash
npm run dev
```

This uses Node's `--watch` flag to automatically restart the server when files change.

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use a strong JWT secret
3. Configure proper CORS origins
4. Use a process manager like PM2
5. Set up proper logging and monitoring

## Future Enhancements

- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] Rate limiting for API endpoints
- [ ] Audit logging for admin actions
- [ ] Subscription payment integration
- [ ] Advanced analytics and reporting
- [ ] Webhook support for external integrations
