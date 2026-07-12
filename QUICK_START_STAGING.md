# Quick Start - Connect to Staging

Based on your staging docker-compose configuration, here are two ways to connect:

## Option 1: Simple - Use Staging API (Recommended) ✅

**No database access needed!** Just connect frontend to staging backend API.

### Step 1: Create `.env.staging` file

```bash
cp .env.staging.ready .env.staging
```

### Step 2: Edit `.env.staging` - Already configured!

The file already has the correct values from your staging docker-compose:
- ✅ `REACT_APP_NODE_HOST=https://api.staging.autostrad.com/api/v1/`
- ✅ `REACT_APP_FILE_SERVER=https://files.staging.autostrad.com/`
- ✅ `REACT_APP_API_KEY=J%P9&g4aIbZn7D3`
- ✅ `REACT_APP_LOCAL_ENCRYPTION_KEY=5C724CE55C702828F3F74B555F594366`

### Step 3: Run the frontend

```bash
npm run start:staging
```

**That's it!** Your frontend will connect to the staging backend API.

---

## Option 2: Run Backend Locally + Connect to Staging DB

If you want to run the backend locally and connect to the staging database:

### Step 1: Create `.env.staging` file

```bash
cp .env.staging.ready .env.staging
```

### Step 2: Edit `.env.staging`

Update the database host with your staging server IP/hostname:

```env
# Frontend - points to local backend
REACT_APP_NODE_HOST=http://localhost:3001/api/v1/

# Backend - connects to staging DB
# Replace with your actual staging server IP or hostname
STAGING_DB_HOST=your-staging-server-ip-or-hostname
STAGING_DB_PORT=3310
STAGING_DB_NAME=arc
STAGING_DB_USER=root
STAGING_DB_PASSWORD=root
```

**Important:** 
- MySQL on staging server is exposed on port **3310** (not 3306)
- You need the staging server's IP address or hostname
- Make sure the staging server allows remote MySQL connections from your IP

### Step 3: Run with Docker Compose

```bash
npm run docker:local-staging
```

This will:
- Start backend locally (port 3001) connected to staging DB
- Start frontend (port 3031) connected to local backend

### Step 4: Access

- Frontend: http://localhost:3031
- Backend API: http://localhost:3001

---

## Which Option to Choose?

### Choose Option 1 if:
- ✅ You just want to test the frontend
- ✅ You don't need to modify backend code
- ✅ You want the simplest setup
- ✅ You don't have staging server IP/access

### Choose Option 2 if:
- ✅ You're developing backend features
- ✅ You need to debug backend code
- ✅ You have staging server IP and database access
- ✅ You want hot reload for backend changes

---

## Troubleshooting

### Option 1 Issues:
- **CORS errors**: Check if staging API allows your origin
- **API not accessible**: Verify staging API URL is correct

### Option 2 Issues:
- **Can't connect to database**: 
  - Check staging server IP is correct
  - Verify port 3310 is accessible
  - Check firewall rules
  - Ensure MySQL allows remote connections
- **Connection timeout**: 
  - You might need VPN access
  - Check network connectivity to staging server

---

## Summary

**From your staging docker-compose, the values are:**

```env
# Frontend
REACT_APP_NODE_HOST=https://api.staging.autostrad.com/api/v1/
REACT_APP_FILE_SERVER=https://files.staging.autostrad.com/
REACT_APP_API_KEY=J%P9&g4aIbZn7D3
REACT_APP_LOCAL_ENCRYPTION_KEY=5C724CE55C702828F3F74B555F594366

# Backend (if connecting to staging DB)
STAGING_DB_HOST=your-staging-server-ip
STAGING_DB_PORT=3310
STAGING_DB_NAME=arc
STAGING_DB_USER=root
STAGING_DB_PASSWORD=root
```





