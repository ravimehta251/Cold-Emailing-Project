# Vercel Deployment Guide for SmartColdMailer Frontend

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with your project code

## Deployment Steps

### 1. Connect Your Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select your GitHub repository containing the SmartColdMailer frontend
4. Vercel will auto-detect it as a Vite project

### 2. Configure Build Settings
Vercel should auto-detect these, but verify:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Set Environment Variables in Vercel Dashboard
After selecting your repository, before deploying:

**Navigate to: Settings → Environment Variables**

Add the following variables:

```
VITE_API_URL = https://cold-emailing-project.onrender.com
VITE_APP_ENV = production
VITE_ENABLE_EMAIL_PREVIEW = true
VITE_ENABLE_ANALYTICS = false
```

### 4. Deploy
- Click "Deploy"
- Wait for the build to complete
- Your frontend will be live at: `https://your-project.vercel.app`

## Important Notes

✅ **What's Already Configured:**
- `.env` file is set for local development
- `VITE_PORT` removed (not needed for Vercel)
- Backend API URL points to Render deployment

✅ **Frontend Build Process:**
- Vite will compile your React app to the `dist/` folder
- Environment variables with `VITE_` prefix are embedded at build time
- No server-side configuration needed

⚠️ **Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| API calls failing from Vercel frontend | Ensure `VITE_API_URL` is set correctly in Vercel dashboard |
| CORS errors | Backend `CORS_ALLOWED_ORIGINS` must include your Vercel domain (e.g., `https://your-project.vercel.app`) |
| Build fails | Clear cache in Vercel: Settings → Git → Redeploy without cache |
| Environment variables not updating | Rebuild the deployment after changing env vars |

## Backend Configuration Update Required

⚠️ **Update your backend `backend/.env` file:**

Add your Vercel frontend URL to `CORS_ALLOWED_ORIGINS`:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-project.vercel.app
```

Then redeploy your backend on Render for the changes to take effect.

## Vercel Project Structure
After deployment, your Vercel dashboard will show:
- **Deployments**: View all deployment history
- **Domains**: Manage custom domains
- **Settings**: Environment variables, build config
- **Analytics**: Performance metrics

## Custom Domain (Optional)
To use a custom domain:
1. In Vercel dashboard, go to Settings → Domains
2. Add your domain and follow DNS setup instructions
3. This will also require updating `CORS_ALLOWED_ORIGINS` in backend

## Rollback to Previous Deployment
If something goes wrong:
1. Vercel dashboard → Deployments
2. Click the previous successful deployment
3. Click "Redeploy"

---

**Need help?** Check Vercel docs: https://vercel.com/docs
