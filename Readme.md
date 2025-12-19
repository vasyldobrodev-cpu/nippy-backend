# 🎬 Media Freelance Backend API

A comprehensive backend API for a media freelancing platform built with Node.js, Express, TypeScript, and PostgreSQL.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Management](#-database-management)
- [File Upload System](#-file-upload-system)
- [Authentication](#-authentication)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🚀 Features

- ✅ **User Authentication** - JWT-based auth with Google OAuth support
- ✅ **File Upload System** - Secure file handling with SHA256 naming
- ✅ **Database Management** - Automatic PostgreSQL database creation
- ✅ **Profile Management** - Comprehensive user profiles for clients/freelancers
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **Data Validation** - Zod schema validation
- ✅ **Error Handling** - Centralized error management
- ✅ **API Documentation** - Swagger/OpenAPI integration

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 12+
- **ORM:** TypeORM
- **Authentication:** JWT + Passport.js
- **Validation:** Zod
- **File Upload:** Multer
- **Documentation:** Swagger

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   # Check version
   node --version
   npm --version
   ```

2. **PostgreSQL** (v12.0 or higher)
   ```bash
   # Check version
   psql --version
   ```

3. **Git**
   ```bash
   # Check version
   git --version
   ```

### PostgreSQL Installation

#### Windows
1. Download PostgreSQL from [official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Default port is `5432`

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database user (optional)
createuser --interactive
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database user
sudo -u postgres createuser --interactive
```

#### Docker (Alternative)
```bash
# Run PostgreSQL in Docker
docker run --name postgres-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=aws_ecommerce_db \
  -p 5432:5432 \
  -d postgres:14
```

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd aws-ecommerce
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
notepad .env  # Windows
nano .env     # Linux/macOS
```

## 🗄️ Database Setup

The application includes automatic database creation and management. Follow these steps:

### 1. Configure Database Connection

Edit your `.env` file with your PostgreSQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-database-password
DB_NAME=aws_ecommerce_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret-key-minimum-32-characters

# Application Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Google OAuth (Optional - Commented out by default)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 2. Automatic Database Setup

The application will automatically create the database when you start the server:

```bash
# Start the development server (creates DB automatically)
npm run dev
```

### 3. Manual Database Setup (Optional)

If you prefer to set up the database manually:

```bash
# Check PostgreSQL connection
npm run db:check

# Create database manually
npm run setup-db

# Alternative method
npm run db:create
```

### 4. Database Setup Output

When successful, you'll see output like this:

```
🔌 Checking PostgreSQL server connection...
✅ PostgreSQL server connected successfully
📊 Server version: PostgreSQL 14.5

🔍 Checking if database exists...
❌ Database 'aws_ecommerce_db' does not exist

🏗️  Creating database...
✅ Database 'aws_ecommerce_db' created successfully

🧪 Testing database connection...
✅ Successfully connected to database 'aws_ecommerce_db'
🕒 Database server time: 2025-01-08 10:30:45.123

🎉 Database initialization completed successfully!
✅ TypeORM data source initialized successfully
```

## ⚙️ Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your-password` |
| `DB_NAME` | Database name | `aws_ecommerce_db` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key-32-chars-min` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `SESSION_SECRET` | Session secret | `your-session-secret` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

### Optional Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | No |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | No |
| `FRONTEND_URL` | Frontend application URL | No |

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start with auto-reload
npm run dev

# Server will be available at:
# http://localhost:3000
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with nodemon |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run setup-db` | Manually create database |
| `npm run db:check` | Test PostgreSQL connection |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run swagger` | Generate API documentation |

## 📖 API Documentation

### Health Check
```bash
GET /health
# Returns server status and database connection info
```

### Authentication Endpoints
```bash
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/forgot-password  # Password reset request
POST /api/auth/reset-password   # Password reset
GET  /api/auth/me          # Get current user
GET  /api/auth/google      # Google OAuth (if configured)
```

### User Endpoints
```bash
GET  /api/users/profile/me    # Get own profile
PUT  /api/users/profile       # Update profile
GET  /api/users/options      # Get dropdown options
GET  /api/users/:id          # Get public user profile
```

### File Upload Endpoints
```bash
POST /api/files/avatar        # Upload avatar (max 2MB)
POST /api/files/documents     # Upload documents (max 5 files)
POST /api/files/portfolio     # Upload portfolio images
POST /api/files/attachments   # Upload attachments
POST /api/files/multiple      # Upload multiple file types
GET  /api/files/my-files      # List user's files
GET  /api/files/stats         # Get file statistics
DELETE /api/files/:id         # Delete file
```

## 🗃️ Database Management

### Database Schema

The application uses TypeORM with the following entities:

- **User** - User profiles and authentication
- **File** - File upload management
- **Category** - Service categories
- **Service** - Freelancer services
- **Job** - Client job postings
- **Proposal** - Service proposals
- **Contract** - Work agreements
- **Order** - Service orders
- **Portfolio** - User portfolios
- **Message** - Communication
- **Payment** - Payment processing
- **Review** - User reviews

### Migrations

```bash
# Generate migration
npx typeorm migration:generate -n MigrationName

# Run migrations
npx typeorm migration:run

# Revert migration
npx typeorm migration:revert
```

### Database Reset (Development Only)

```bash
# ⚠️  WARNING: This will delete all data!
# Stop the server, then:

# Connect to PostgreSQL
psql -U postgres -h localhost

# Drop and recreate database
DROP DATABASE aws_ecommerce_db;
CREATE DATABASE aws_ecommerce_db;

# Restart the application
npm run dev
```

## 📁 File Upload System

### Upload Configuration

| File Type | Max Size | Max Files | Allowed Types |
|-----------|----------|-----------|---------------|
| Avatar | 2MB | 1 | JPG, PNG, WebP |
| Documents | 10MB | 5 | PDF, DOC, DOCX, TXT |
| Portfolio | 5MB | 10 | JPG, PNG, WebP, GIF |
| Attachments | 10MB | 5 | Mixed types |

### File Naming

Files are automatically renamed using SHA256 hashes for security:
- Original: `my-document.pdf`
- Stored as: `a1b2c3d4e5f6...xyz.pdf`
- Database tracks both original and hashed names

### Upload Examples

```bash
# Upload avatar
curl -X POST http://localhost:3000/api/files/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@path/to/image.jpg" \
  -F "description=Profile picture"

# Upload multiple documents
curl -X POST http://localhost:3000/api/files/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "documents=@document1.pdf" \
  -F "documents=@document2.docx" \
  -F "descriptions[]=Resume" \
  -F "descriptions[]=Portfolio"
```

## 🔐 Authentication

### JWT Authentication

The API uses JWT tokens for authentication:

```javascript
// Login response includes token
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Include token in subsequent requests
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### Google OAuth (Optional)

To enable Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Uncomment and set environment variables:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   ```

## 🔧 Troubleshooting

### Common Database Issues

#### Connection Failed
```bash
Error: connection to PostgreSQL server failed
```
**Solutions:**
1. Check if PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify credentials in `.env` file
3. Check firewall settings
4. Test connection: `npm run db:check`

#### Database Already Exists
```bash
Error: database "aws_ecommerce_db" already exists
```
**Solutions:**
1. This is normal - the database setup will skip creation
2. If you want to reset: see [Database Reset](#database-reset-development-only)

#### Permission Denied
```bash
Error: permission denied to create database
```
**Solutions:**
1. Grant database creation privileges:
   ```sql
   ALTER USER postgres CREATEDB;
   ```
2. Or use a superuser account

### Common Application Issues

#### Port Already in Use
```bash
Error: Port 3000 is already in use
```
**Solutions:**
1. Change port in `.env`: `PORT=5000`
2. Kill existing process: `lsof -ti:3000 | xargs kill`

#### TypeScript Compilation Errors
```bash
npm run build
# Check for compilation errors
```

#### Missing Dependencies
```bash
npm install
# Reinstall all dependencies
```

### Environment Issues

#### JWT Secret Too Short
```bash
Error: JWT secret must be at least 32 characters
```
**Solution:** Update `JWT_SECRET` in `.env` with a longer string

#### Google OAuth Not Working
**Solutions:**
1. Verify Google OAuth credentials
2. Check callback URL matches Google Console
3. Ensure environment variables are uncommented

### File Upload Issues

#### File Too Large
```bash
Error: File too large
```
**Solutions:**
1. Check file size limits in documentation
2. Compress files before upload
3. Adjust limits in `upload.ts` if needed

#### Invalid File Type
```bash
Error: Invalid file type
```
**Solution:** Check allowed file types for each endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint:fix`
6. Commit changes: `git commit -m 'Add feature'`
7. Push to branch: `git push origin feature-name`
8. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📞 Support

If you encounter any issues:

1. Check this README for solutions
2. Search existing GitHub issues
3. Create a new issue with:
   - Environment details (OS, Node.js version, PostgreSQL version)
   - Error messages and logs
   - Steps to reproduce

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📚 Quick Reference

### Essential Commands
```bash
# Setup and start
npm install
npm run setup-db  # if needed
npm run dev

# Database management
npm run db:check
npm run db:create

# Development
npm run build
npm run lint
npm test

# Production
npm start
```

### Important URLs
- **API Base:** `http://localhost:3000/api`
- **Health Check:** `http://localhost:3000/health`
- **File Uploads:** `http://localhost:3000/uploads/`

### Default Credentials
- **Database:** `postgres` / `password` (change in `.env`)
- **Port:** `3000`
- **Database Name:** `aws_ecommerce_db`

Happy coding! 🎉

Best
