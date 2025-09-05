# Railway Deployment Guide

## Overview
This guide explains how to deploy the crypto-feed scraper to Railway while keeping the blog on Vercel.

## Architecture
- **Vercel**: Next.js blog (`packages/blog/`)
- **Railway**: Scraper service (`packages/scraper/`)  
- **Supabase**: Shared database

## Railway Setup

### 1. Create Railway Project
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your crypto-feed repository
4. Railway will automatically detect the `railway.json` configuration

### 2. Environment Variables
Add these variables in Railway dashboard under "Variables":

#### Required Variables
```
SUPABASE_URL=https://lzkuyfcwtpninghtzsoz.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here
```

#### Optional Configuration
```
ENABLE_CURATION=true
CURATION_BATCH_DELAY=200
NODE_ENV=production
PORT=3000
```

### 3. Deploy Settings
The `railway.json` file configures:
- **Build**: Installs dependencies in `packages/scraper/`
- **Start**: Runs `npm start` which starts the cron scheduler
- **Restart Policy**: Restarts on failure (max 10 retries)

### 4. Health Check
The service exposes a health check endpoint:
- **URL**: `https://your-railway-app.railway.app/health`
- **Purpose**: Railway monitoring and status checks
- **Response**: JSON with service status, uptime, and processing state

## Deployment Process

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Railway configuration"
git push origin main
```

### 2. Railway Auto-Deploy
- Railway detects changes and deploys automatically
- Check deployment logs in Railway dashboard
- Service starts with cron scheduler (runs every 6 hours)

### 3. Verify Deployment
1. Check Railway logs for successful startup
2. Visit health endpoint: `https://your-app.railway.app/health`
3. Verify articles appear in Supabase database
4. Check that blog receives new articles

## Monitoring

### Railway Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: History and rollback options

### Health Check Response
```json
{
  "status": "healthy",
  "service": "crypto-feed-scraper", 
  "uptime": 12345,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "isRunning": "idle"
}
```

## Cost Estimation
- **Railway Starter**: $5/month (500GB outbound)
- **Railway Pro**: $20/month (unlimited resources)
- **Free Trial**: Available for testing

## Troubleshooting

### Common Issues
1. **Environment Variables**: Ensure all required vars are set in Railway dashboard
2. **Build Failures**: Check Railway build logs for npm install errors
3. **Health Check**: Service must respond on PORT environment variable
4. **Database Connection**: Verify Supabase credentials and network access

### Debug Commands
```bash
# Check Railway service status
railway status

# View live logs  
railway logs

# Connect to service shell
railway shell
```

## Production Checklist
- [ ] All environment variables configured in Railway
- [ ] Blog deployed to Vercel with same Supabase connection
- [ ] Health check endpoint responding
- [ ] Cron scheduler running (check logs every 6 hours)
- [ ] Articles appearing in Supabase database
- [ ] Blog displaying new articles