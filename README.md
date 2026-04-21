# TrackPair

TrackPair is a two-person accountability challenge app built with Next.js + Firebase.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill values:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

## Deploy to Vercel

This repo is configured for Vercel (`vercel.json` included).

### 1) Import project

- Go to [Vercel](https://vercel.com/new)
- Import this GitHub repository
- Framework should auto-detect as **Next.js**

### 2) Set environment variables

In Vercel Project Settings -> Environment Variables, add all values from `.env.example`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
- `ANTHROPIC_API_KEY` (if you use Anthropic features)

### 3) Firebase Auth domain setup (required)

After first deploy, add your Vercel domain(s) in Firebase Console:

- Firebase Console -> Authentication -> Settings -> Authorized domains
- Add:
  - `your-project.vercel.app`
  - your custom production domain (if any)

Without this, Firebase sign-in can fail in production.

### 4) Deploy Firestore config (rules + indexes)

From this repo:

```bash
firebase deploy --only firestore --project track-app-95f63
```

This deploys:
- `firestore.rules`
- `firestore.indexes.json`

### 5) Deploy app

Push to `main` (or click Deploy in Vercel).

## Test & Lint

```bash
npm run lint
npm run test
```
