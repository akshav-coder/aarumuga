# Deployment Guide

## Frontend (Vercel)
- URL: https://aarumuga.vercel.app
- Repository: https://github.com/akshav-coder/aarumuga

## Backend (Render)
- URL: https://aarumuga-backend.onrender.com
- Repository: https://github.com/akshav-coder/aarumuga

## Environment Variables

### Vercel (Frontend)
Add this environment variable in Vercel Dashboard → Settings → Environment Variables:
- **Name**: `VITE_API_URL`
- **Value**: `https://aarumuga-backend.onrender.com`
- **Environments**: Production, Preview, Development (select all)

### Render (Backend)
Environment variables are already set:
- `NODE_ENV` = `production`
- `PORT` = `5001`
- `MONGODB_URI` = Your MongoDB Atlas connection string

## After Updating Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete
5. Test the app at https://aarumuga.vercel.app

## Testing

1. Open https://aarumuga.vercel.app on your phone
2. Check if the dashboard loads
3. Try creating a sale or viewing stock
4. If you see API errors, check:
   - Backend is running (check Render dashboard)
   - CORS is configured correctly
   - Environment variable is set in Vercel

## Notes

- Render free tier: Services may spin down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.
- Vercel: Automatically redeploys on git push to main branch.

