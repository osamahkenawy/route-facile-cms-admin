# Quick Commands - Staging

## Run Project with Staging Configuration

```bash
npm run start:staging
```

This will:
- ✅ Connect to staging API: `https://api.staging.autostrad.com/api/v1/`
- ✅ Use staging file server: `https://files.staging.autostrad.com/`
- ✅ Run on `http://localhost:3000`

## Other Useful Commands

### Regular Development (Local)
```bash
npm start
```

### Production Build
```bash
npm run build:staging
```

### Stop the Server
Press `Ctrl + C` in the terminal

## Environment File

The staging configuration is in `.env.staging` file:
- `REACT_APP_NODE_HOST` - Staging API URL
- `REACT_APP_FILE_SERVER` - Staging file server
- `REACT_APP_API_KEY` - API key
- `REACT_APP_LOCAL_ENCRYPTION_KEY` - Encryption key

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run start:staging` | Run with staging config |
| `npm start` | Run with local/default config |
| `npm run build:staging` | Build for staging |

