# How to Get Staging Database Credentials

You need these values for `.env.staging` file (lines 18-20):
- `STAGING_DB_HOST`
- `STAGING_DB_PORT`
- `STAGING_DB_NAME`
- `STAGING_DB_USER`
- `STAGING_DB_PASSWORD`

## Option 1: Check the Server (Recommended)

The staging database credentials are configured on the staging server. Here's how to find them:

### Step 1: SSH into the Staging Server
```bash
ssh user@your-staging-server-ip
```

### Step 2: Navigate to Backend Directory
```bash
cd /path/to/arc-backend/ARC
```

### Step 3: Check Environment Variables

**Option A: Check Docker Compose Environment**
```bash
# View the running container's environment variables
docker-compose -f docker-compose.staging.yml exec nestjs env | grep MYSQL
```

**Option B: Check for .env file**
```bash
# Look for environment files
ls -la | grep env
cat .env.staging  # if exists
cat .env          # if exists
```

**Option C: Check Docker Container Environment**
```bash
# Get the container ID
docker ps | grep nestjs

# Inspect the container's environment
docker inspect <container-id> | grep -A 20 "Env"
```

**Option D: Check Running Container Environment Variables**
```bash
docker-compose -f docker-compose.staging.yml exec nestjs printenv | grep MYSQL
```

### Step 4: Check Database Connection in Code
```bash
# The backend uses these environment variables (from src/app.module.ts):
# MYSQL_HOST
# MYSQL_PORT
# MYSQL_USER
# MYSQL_PASSWORD
# MYSQL_DATABASE
```

## Option 2: Check Server Configuration Files

### Check for Configuration Files:
```bash
# On the server, check these locations:
cat /etc/environment
cat ~/.bashrc | grep MYSQL
cat ~/.profile | grep MYSQL

# Check if there's a secrets manager
# AWS: aws secretsmanager get-secret-value
# Azure: az keyvault secret show
```

## Option 3: Ask Your Team

Contact your:
- **DevOps Engineer** - They manage server configurations
- **Backend Developer** - They know the database setup
- **Database Administrator** - They have direct access to database credentials

## Option 4: Check Deployment Scripts

Look for deployment scripts that might have the credentials:
```bash
# On the server
ls -la deploy*.sh
cat deploy-staging.sh | grep -i mysql
```

## Option 5: Check Server Documentation

Check if there's documentation about:
- Server setup
- Database configuration
- Environment variables
- Deployment procedures

## What You're Looking For

The credentials should look something like:

```env
STAGING_DB_HOST=staging-db.example.com    # or IP address
STAGING_DB_PORT=3306                       # usually 3306 for MySQL
STAGING_DB_NAME=autostrad_staging          # database name
STAGING_DB_USER=staging_user                # database username
STAGING_DB_PASSWORD=your_password_here     # database password
```

## Important Notes:

1. **Security**: Never commit database credentials to Git
2. **Remote Access**: Make sure the staging database allows remote connections from your IP
3. **Firewall**: Ensure port 3306 (or your DB port) is accessible
4. **VPN**: You might need to be on a VPN to access the staging database

## If You Can't Find the Credentials:

1. **Check with your team** - Someone should have access to these
2. **Check password managers** - Credentials might be stored in 1Password, LastPass, etc.
3. **Check project documentation** - There might be a wiki or docs with this info
4. **Check CI/CD configuration** - If you use Jenkins/GitLab CI, credentials might be there

## Alternative: Use Staging API Instead

If you can't get direct database access, you can still connect to the staging backend API:

```env
# In .env.staging, just use the staging API URL:
REACT_APP_NODE_HOST=https://api.staging.autostrad.com/api/v1/
```

This way, you don't need database credentials - the frontend just connects to the staging backend API.





