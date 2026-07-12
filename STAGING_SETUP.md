# Staging Database Connection Setup

This guide explains how to connect the admin portal to a staging database/backend.

## Option 1: Point Frontend to Staging Backend API (Recommended)

This is the simplest approach - just configure the frontend to point to your staging backend API.

### Steps:

1. **Create a `.env.staging` file** (copy from `env.staging.template`):
   ```bash
   cp env.staging.template .env.staging
   ```

2. **Fill in your staging backend details** in `.env.staging`:
   ```env
   REACT_APP_NODE_HOST=http://your-staging-api-url.com/api/v1/
   REACT_APP_FILE_SERVER=http://your-staging-file-server.com/
   REACT_APP_API_KEY=your-staging-api-key
   REACT_APP_LOCAL_ENCRYPTION_KEY=your-encryption-key
   ```

3. **Run with staging environment**:
   ```bash
   npm run start:staging
   ```

   Or manually:
   ```bash
   env-cmd -f .env.staging npm start
   ```

## Option 2: Docker Compose for Staging

Use Docker Compose to run the frontend connected to staging backend.

### Steps:

1. **Create `.env.staging` file** with your staging configuration (see Option 1)

2. **Build and run with Docker Compose**:
   ```bash
   docker-compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:3031

4. **View logs**:
   ```bash
   docker-compose -f docker-compose.staging.yml logs -f
   ```

5. **Stop the containers**:
   ```bash
   docker-compose -f docker-compose.staging.yml down
   ```

## Option 3: Development Mode with Staging Backend

Run in development mode but connect to staging backend.

### Steps:

1. **Create `.env.staging` file** (see Option 1)

2. **Run development server with staging env**:
   ```bash
   env-cmd -f .env.staging npm start
   ```

   Or use Docker Compose for dev:
   ```bash
   docker-compose -f docker-compose.dev.yml --env-file .env.staging up
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_NODE_HOST` | Backend API base URL | `http://staging-api.example.com/api/v1/` |
| `REACT_APP_FILE_SERVER` | File server URL for images | `http://staging-files.example.com/` |
| `REACT_APP_API_KEY` | API key for authentication | `your-api-key-here` |
| `REACT_APP_LOCAL_ENCRYPTION_KEY` | Encryption key for local storage | `your-encryption-key` |

## Troubleshooting

### CORS Issues
If you encounter CORS errors when connecting to staging backend:
- Ensure the staging backend has CORS configured to allow your frontend origin
- Check if you need to use a proxy (see `package.json` for proxy configuration)

### Connection Issues
- Verify the staging backend URL is accessible
- Check network connectivity
- Ensure API keys are correct

### Docker Issues
- Make sure Docker is running
- Check if ports 3000 or 3031 are already in use
- View container logs: `docker-compose logs -f`

## Option 4: Run Backend Locally with Staging Database (Recommended for Development)

Run the backend locally on your machine, but connect it to the staging database on the server. The frontend connects to your local backend.

### Steps:

1. **Create `.env.staging` file** with staging database credentials:
   ```env
   # Frontend config (points to local backend)
   REACT_APP_NODE_HOST=http://localhost:3001/api/v1/
   REACT_APP_FILE_SERVER=http://your-staging-file-server.com/
   REACT_APP_API_KEY=your-staging-api-key
   REACT_APP_LOCAL_ENCRYPTION_KEY=your-encryption-key
   
   # Backend config (connects to staging DB)
   STAGING_DB_HOST=your-staging-db-host.com
   STAGING_DB_PORT=3306
   STAGING_DB_NAME=your_staging_db_name
   STAGING_DB_USER=your_staging_db_user
   STAGING_DB_PASSWORD=your_staging_db_password
   ```

2. **Run with Docker Compose** (backend + frontend):
   ```bash
   npm run docker:local-staging
   ```

   This will:
   - Start the backend locally (port 3001) connected to staging DB
   - Start the frontend (port 3031) connected to local backend
   - Optionally start local Redis

3. **Access the application**:
   - Frontend: http://localhost:3031
   - Backend API: http://localhost:3001
   - Swagger Docs: http://localhost:3001/api (if enabled)

4. **For development mode** (with hot reload):
   ```bash
   npm run docker:local-dev
   ```

5. **Stop the containers**:
   ```bash
   npm run docker:local-staging:down
   ```

### Manual Setup (Without Docker)

If you prefer to run without Docker:

1. **Start Backend** (in `../arc-backend/ARC` directory):
   ```bash
   cd ../arc-backend/ARC
   # Set environment variables
   export MYSQL_HOST=your-staging-db-host.com
   export MYSQL_PORT=3306
   export MYSQL_USER=your_staging_db_user
   export MYSQL_PASSWORD=your_staging_db_password
   export MYSQL_DATABASE=your_staging_db_name
   export NODE_ENV=staging
   
   # Install dependencies and run
   npm install
   npm run start:dev
   ```

2. **Start Frontend** (in this directory):
   ```bash
   # Create .env.staging with REACT_APP_NODE_HOST=http://localhost:3001/api/v1/
   npm run start:staging
   ```

## Notes

- The frontend application doesn't directly connect to a database - it connects to a backend API
- The backend API handles database connections
- **Option 4** allows you to run the backend locally while using the staging database, which is ideal for development and testing
- Make sure your staging database allows remote connections from your IP address
- If you get connection errors, check firewall rules and database user permissions

