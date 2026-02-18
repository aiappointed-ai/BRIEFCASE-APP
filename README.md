# BriefCase — Be Briefed. Be Ready.

Multi-user relationship prep and recruitment scouting tool.

## Quick Start (Demo Mode — No Supabase Needed)

Works immediately with localStorage. No accounts, no setup.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Full Setup with Supabase (Multi-User + Sync)

### 1. Create a Supabase Project
- Go to supabase.com and create a free account
- Click "New Project", give it a name, set a database password
- Wait for it to finish provisioning (~1 minute)

### 2. Run the Database Schema
- In your Supabase dashboard, go to SQL Editor
- Click "New Query"
- Paste the entire contents of `supabase-schema.sql` from this project
- Click "Run" — this creates all tables, security policies, and indexes

### 3. Get Your API Keys
- Go to Settings > API in your Supabase dashboard
- Copy your "Project URL" and "anon public" key

### 4. Configure the App
Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 5. Deploy to Vercel
- Push to GitHub
- Import in Vercel
- Add the two environment variables in Vercel's project settings
- Deploy

### 6. Enable Auth
- In Supabase dashboard, go to Authentication > Providers
- Email provider is enabled by default
- Optional: Disable "Confirm email" under Authentication > Settings for easier testing

## How It Works

### Demo Mode (no Supabase)
- Data saves to browser localStorage
- Single user, no sync
- Great for testing the UI

### Online Mode (with Supabase)
- Login/signup screen appears
- Coaches, events, and players sync across all users
- Players table has real-time sync (new scouts appear instantly for everyone)
- Each coach can add private notes and ratings on shared player profiles
- Duplicate detection prevents the same player (by jersey # + event) from being entered twice

## Database Structure

- `coaches` — shared coach contact profiles
- `events` — showcase events
- `players` — shared athlete profiles (scouted at showcases)
- `coach_notes` — private per-coach notes on players (only you see yours)

## Features
- Coach Prep Mode: swipeable flashcards for event day
- Recruitment Mode: scout players with jersey colors, ratings, notes
- Per-coach private notes on shared players
- Duplicate player detection
- Real-time player sync across coaches
- PWA (installable on phone home screen)
- Works offline in demo mode
