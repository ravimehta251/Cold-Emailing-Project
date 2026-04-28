# Frontend Deployment Guide

## Problem Solved ✅
The error "Environment Variable 'VITE_APP_ENV' references Secret 'vite_app_env', which does not exist" has been fixed.

## Environment Files Structure

```
frontend/
├── .env                 (Local development)
├── .env.production      (Production builds)
└── .env.example         (Reference template)
```

## For Local Development

**File: `.env`**
```
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development
VITE_ENABLE_EMAIL_PREVIEW=true
VITE_ENABLE_ANALYTICS=false
```

Run with: `npm run dev`

## For Production Deployment

### Option 1: Vercel Deployment

1. **Connect your GitHub repository to Vercel**
2. **Set Environment Variables:**
   - Go to **Settings → Environment Variables**
   - Add these variables for Production:
     ```
     VITE_API_URL = https://cold-emailing-project.onrender.com
     VITE_APP_ENV = production
     VITE_ENABLE_EMAIL_PREVIEW = true
     VITE_ENABLE_ANALYTICS = true
     ```
3. **Deploy:**
   - Vercel automatically builds on git push
   - Uses environment variables during build
   - Production build includes `.env.production` values

### Option 2: Render Deployment

1. **Create a new Web Service from your repository**
2. **Configure Build Command:**
   ```
   npm install && npm run build
   ```
3. **Set Environment Variables:**
   - Go to **Settings → Environment Variables**
   - Add each VITE_* variable:
     ```
     VITE_API_URL=https://cold-emailing-project.onrender.com
     VITE_APP_ENV=production
     VITE_ENABLE_EMAIL_PREVIEW=true
     VITE_ENABLE_ANALYTICS=true
     ```
4. **Deploy from GitHub**

### Option 3: Docker/Self-Hosted

Add to your Dockerfile:
```dockerfile
ARG VITE_API_URL=https://cold-emailing-project.onrender.com
ARG VITE_APP_ENV=production
ARG VITE_ENABLE_EMAIL_PREVIEW=true
ARG VITE_ENABLE_ANALYTICS=true

RUN npm run build
```

## Environment Variables Reference

| Variable | Development | Production | Purpose |
|----------|------------|-----------|---------|
| `VITE_API_URL` | `http://localhost:8080` | `https://your-backend-url.com` | Backend API endpoint |
| `VITE_APP_ENV` | `development` | `production` | Application mode |
| `VITE_ENABLE_EMAIL_PREVIEW` | `true` | `true` | Show email preview feature |
| `VITE_ENABLE_ANALYTICS` | `false` | `true` | Enable analytics tracking |

## Build Process

When you run `npm run build`:
1. Vite reads `.env.production` file
2. Loads all `VITE_*` variables
3. Embeds them into the built files
4. Creates optimized production bundle

## Testing Production Build Locally

```bash
# Build production version
npm run build

# Preview production build locally
npm run preview
```

This runs on `http://localhost:4173` using production settings.

## Common Issues & Fixes

### Issue: Variables not loading during deployment

**Solution:**
- Ensure all `VITE_*` variables are set in deployment platform
- Restart/redeploy after adding environment variables
- Check that variable names are exactly as specified (case-sensitive)

### Issue: API calls failing after deployment

**Solution:**
- Verify `VITE_API_URL` points to your actual backend
- Check backend CORS settings allow your frontend domain
- Check backend is running and accessible

### Issue: .env.production not being used

**Solution:**
- `npm run build` automatically uses `.env.production`
- Don't manually set `VITE_*` environment variables when using `.env.production`
- Platform environment variables override `.env.production`

## Security Notes

⚠️ **Important:**
- Never commit sensitive values to `.env`
- Only commit `.env.example` to git
- Frontend env variables are visible in browser (don't store secrets)
- Sensitive info (API keys, secrets) must be in backend/.env only

## Quick Checklist

- [ ] Create `.env.production` with production URLs
- [ ] Set environment variables in deployment platform
- [ ] Test build locally: `npm run build && npm run preview`
- [ ] Verify API calls work in production
- [ ] Check browser console for any environment-related errors
- [ ] Monitor deployed app for connectivity issues
