# Regulation Manifest

Maritime Regulatory Compliance & Seatime Tracker PWA

## Deploy to Render

### Option 1: One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Manual Setup

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name:** regulation-manifest
   - **Environment:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start Command:** `npm start`
6. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `file:./prisma/data/tanker-calendar.db`
   - `JWT_SECRET` = (generate a secure random string)
7. Click "Create Web Service"

## Demo Credentials
- Email: demo@tankertrack.com
- Password: demo123

## Features
- STCW/MLC compliant sea service tracking
- PDF export for flag state submissions
- 182+ maritime regulations reference
- PWA with offline support
