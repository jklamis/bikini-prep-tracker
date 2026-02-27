Jess’ Bikini Prep Tracker 💪✨
My road to the stage — November 2026
Project Overview
Jess’ Bikini Prep Tracker is a production-deployed Next.js application built to:
- Track structured 10-day training cycles
- Log sets (weight + reps) per exercise
- Store workout notes
- Track water intake with daily reset
- Mark completed training days with timestamps
- Sync all data securely across devices
- Deploy as a live, mobile-ready web app

The application is optimized for daily gym use and accessible on desktop and mobile.
Architecture Overview
Frontend (Next.js + React)
↓
Cloud Authentication + Database (Supabase / PostgreSQL)
↓
Production Hosting (Vercel)
Technologies Used
Next.js
A React-based framework for building production-ready web applications.

Role in this app:
- Renders UI
- Handles routing (/ and /calendar)
- Manages state
- Connects to Supabase
- Optimized for Vercel deployment
React
A JavaScript library for building interactive user interfaces.

Role in this app:
- Manages component state (workouts, water, completions)
- Handles dynamic UI updates
- Controls day navigation and workout logging
Supabase
An open-source backend-as-a-service built on PostgreSQL.

Role in this app:
- User authentication (email + password)
- Cloud database storage
- Row-level security
- Device sync (phone + laptop)
PostgreSQL
A relational database used internally by Supabase.

Role in this app:
- Stores structured JSON app snapshots
- Ensures reliable data persistence
Vercel
A cloud hosting platform optimized for Next.js applications.

Role in this app:
- Hosts the production build
- Provides public URL
- Automatically redeploys on GitHub push
- Securely injects environment variables
Git & GitHub
Version control and repository hosting tools.

Role in this project:
- Tracks code changes
- Stores source code
- Connects to Vercel for automatic deployment
- Enables safe iteration and rollback
Environment Variables
Sensitive keys are stored as environment variables:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

These are stored in .env.local for development and added in Vercel for production.
They are never committed to GitHub.
Core Features
1. 10-Day Training Cycle
- Toggle between Day 1–10
- Wrap-around navigation
- Static workout structure per day

2. Workout Logging
- Add/remove sets
- Log weight + reps
- Per-day persistent storage
- Free-text notes

3. Completion Tracking
- Mark day complete
- Timestamp saved
- Completion history displayed

4. Water Tracker
- Manual entry
- +8 oz quick-add
- Progress bar
- Auto-reset daily using device date

5. Cloud Sync
- Email/password authentication
- Save full app snapshot to Supabase
- Load snapshot from cloud
- Sync across devices
Development Workflow
1. Local development with npm run dev
2. Commit changes using Git
3. Push to GitHub
4. Vercel auto-deploys updated build
5. Production URL updates instantly
Deployment Steps
1. Install Git
2. Initialize repository
3. Push to GitHub
4. Import project into Vercel
5. Add Supabase environment variables
6. Deploy
7. Access live URL
8. Add to phone home screen
Project Status
Production Deployed
Cloud Sync Enabled
Mobile Ready
Authentication Active












This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
