# Herald Auth

> Today's Carolinian's centralized Identity Provider (IdP) implementing Single Sign-On (SSO) across all TC applications.

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-Latest-orange?style=flat-square&logo=hono)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Latest-red?style=flat-square&logo=turborepo)](https://turbo.build/)

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Apps & Packages](#-apps--packages)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)

## 🎯 Overview

Herald is Today's Carolinian's authentication system that provides:

- **Single Sign-On (SSO)** across TC ecosystem ([todayscarolinian.com](https://todayscarolinian.com), [archives.todayscarolinian.com](https://archives.todayscarolinian.com), [uscdays.todayscarolinian.com](https://uscdays.todayscarolinian.com))
- **Centralized User Management** with position-based access control (ABAC)
- **Secure Session Management** with configurable durations (5-30 days)
- **Admin Dashboard** for user CRUD operations (restricted to 6 positions)
- **Email Verification** with auto-login on confirmation
- **Password Management** with forced password change on first login

### Core Responsibilities

1. **Authentication** - Verify credentials, issue session tokens, manage session lifecycle
2. **Authorization (ABAC)** - Position-based access control for user management
3. **User Management** - Account creation, bulk CSV import, profile management
4. **Session Governance** - SSO session sharing via secure cookies

## 🏗️ Architecture

### TurboRepo Monorepo Structure

```
herald/ (root)
├── apps/
│   ├── core/              # Next.js 16+ Frontend (herald.todayscarolinian.com)
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # UI components (shadcn/ui)
│   │   ├── lib/           # Client utilities
│   │   └── public/        # Static assets
│   │
│   └── auth/              # Hono.js Auth API (auth.todayscarolinian.com)
│       ├── src/
│       │   ├── routes/    # API endpoints
│       │   ├── lib/       # BetterAuth config
│       │   └── middleware/# Rate limiting, CORS
│       └── index.ts
│
├── packages/              # Shared workspace packages
│   ├── eslint-config/     # Shared ESLint configs
│   ├── typescript-config/ # Shared tsconfig.json files
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utility functions
│
├── turbo.json             # Turborepo pipeline config
├── package.json           # Root workspace config
└── README.md              # This file
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser 🌐                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ├──────────────┬────────────────┬───────────────┐
         ▼              ▼                ▼               ▼
    ┌────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │Herald  │    │Main Site│    │Archives  │    │USC Days  │
    │Core    │    │         │    │          │    |          │
    └────┬───┘    └────┬────┘    └────┬─────┘    └────┬─────┘
         │             │              │               │
         │             └──────┬───────┴───────────────┘
         │                    │ Verify Session
         ▼                    ▼
    ┌─────────────────────────────────────┐
    │  Herald Auth Microservice (Hono)    │
    │  • BetterAuth Integration           │
    │  • Email Service (Resend)           │
    │  • Rate Limiting (Redis)            │
    └──────────────┬──────────────────────┘
                   │
         ┌─────────┴──────────┬────────────┐
         ▼                    ▼            ▼
    ┌──────────┐        ┌──────────┐   ┌────────┐
    │Firestore │        │BetterAuth│   │Resend  │
    │(Users &  │        │          │   │(Email) │
    │App Data) │        │          │   │        │
    └──────────┘        └──────────┘   └────────┘
```

### Session Flow

All TC applications share sessions via secure cookies under `.todayscarolinian.com`:

```javascript
{
  httpOnly: true,           // Prevents XSS attacks
  secure: true,             // HTTPS only
  sameSite: 'lax',          // CSRF protection
  domain: '.todayscarolinian.com',  // Shared across subdomains
  maxAge: rememberMe ? 2592000 : 432000  // 30 days or 5 days
}
```

## 📦 Apps & Packages

This monorepo uses [Turborepo](https://turbo.build/) and contains the following apps:

### Apps

- **`core`** - Next.js 16+ application providing:
  - Login/logout interface
  - User dashboard (accessible to all authenticated users)
  - Admin dashboard for user management (restricted to 6 positions)
  - Profile management (self-service for all users)
  - Deployed at: `herald.todayscarolinian.com`

- **`auth`** - Hono.js microservice providing:
  - Authentication API endpoints
  - BetterAuth integration
  - Email service via Resend
  - Rate limiting with Vercel KV (Redis)
  - Session token management
  - Deployed at: `auth.todayscarolinian.com`

### Packages (Shared)

- `@herald/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@herald/typescript-config`: `tsconfig.json`s used throughout the monorepo
- `@herald/types` - Shared TypeScript types
- `@herald/utils` - Shared utility functions

> **Note:** Add shared packages here as the monorepo grows

## 🛠️ Tech Stack

### Frontend (`core`)

- **Framework:** Next.js 16+ with App Router
- **Language:** TypeScript
- **UI Components:** shadcn/ui + Tailwind CSS
- **Form Management:** React Hook Form + Zod validation
- **State Management:** React Context + Server Components

### Backend (`auth`)

- **Runtime:** Node.js
- **Framework:** Hono.js
- **Authentication:** BetterAuth
- **Database:** Cloud Firestore (NoSQL)
- **Email Service:** Resend
- **Rate Limiting:** Vercel KV (Redis)

### Infrastructure

- **Hosting:** Vercel
- **Database:** Cloud Firestore
- **Cache/Session Store:** Vercel KV (Redis)
- **Email Delivery:** Resend
- **SSL/TLS:** Automatic via Vercel
- **CDN:** Vercel Edge Network

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- Firebase project (Development & Production)
- Resend account & API key
- Vercel KV (Redis) database

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/todays-carolinian/herald.git
cd herald
```

1. **Install dependencies**

```bash
npm install
```

1. **Set up environment variables**

Create `.env.local` files in both `apps/core` and `apps/auth`:

```bash
# For apps/core/.env.local
cp apps/core/.env.example apps/core/.env.local

# For apps/auth/.env.local
cp apps/auth/.env.example apps/auth/.env.local
```

Fill in the required values (see [Environment Variables](#-environment-variables) section).

1. **Start development servers**

```bash
# Start all apps
npm run dev

# Or start individual apps
npm run dev:core      # Herald Core on http://localhost:3000
npm run dev:auth      # Herald Auth on http://localhost:3001
```

## 💻 Development

### Project Structure

```shell
herald-auth/
├── apps/
│   ├── core/                   # Next.js frontend application
│   │   ├── app/                # Next.js App Router
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities and helpers
│   │   └── public/             # Static assets
│   └── auth/                   # Hono.js auth microservice
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── lib/            # BetterAuth setup, utilities
│       │   └── middleware/     # Rate limiting, CORS, etc.
│       └── index.ts            # Entry point
├── packages/                   # Shared packages (future)
├── turbo.json                  # Turborepo configuration
└── package.json                # Root package.json
```

### Available Scripts

#### Development Commands

```bash
# Start all apps in development mode (uses Turborepo)
npm run dev
# Runs: turbo dev --parallel
# Starts apps/core (port 3000) and apps/auth (port 3001) concurrently

# Start individual apps
npm run dev:core          # Start Herald UI only (http://localhost:3000)
npm run dev:auth          # Start Auth service only (http://localhost:3001)
```

#### Build Commands

```bash
# Build all apps for production (uses Turborepo cache)
npm run build
# Runs: turbo build
# Builds in optimal order based on dependency graph

# Build individual apps
npm run build:core        # Build Herald UI only
npm run build:auth        # Build Auth service only
```

#### Code Quality Commands

```bash
# Lint all code using ESLint
npm run lint
# Runs: turbo lint
# Uses @herald/eslint-config for consistent rules

# Format all code using Prettier
npm run format
# Runs: prettier --write "**/*.{ts,tsx,md,json}"

# Type-check all TypeScript
npm run typecheck
# Runs: turbo type-check (if configured)
```

#### Testing Commands

```bash
# Run all tests
npm run test
# Runs: turbo test

# Run tests in watch mode
npm run test:watch
```

### Database Setup (Firestore)

Herald uses Firestore with the following collections:

- **`users`** - User profiles (id, email, name, position, profilePicture, createdAt, updatedAt)
- **`sessions`** - Session tokens (managed by BetterAuth)
- **`auditLogs`** - Admin action logs (who, what, when)

## 📦 Adding New Packages

### Adding a New Shared Package

1. **Create the package directory:**

```bash
mkdir -p packages/my-package
cd packages/my-package
```

2. **Initialize with `package.json`:**

```json
{
  "name": "@herald/my-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@herald/eslint-config": "*",
    "@herald/typescript-config": "*",
    "typescript": "^5.3.3"
  }
}
```

3. **Create `tsconfig.json`:**

```json
{
  "extends": "@herald/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

4. **Create source files:**

```bash
mkdir src
echo 'export const hello = () => "Hello from my-package";' > src/index.ts
```

5. **Use the package in an app:**

```typescript
// In apps/core/app/page.tsx
import { hello } from '@herald/my-package'

console.log(hello())
```

### Best Practices for Shared Packages

- ✅ Use `@herald/*` namespace for internal packages
- ✅ Keep packages focused and single-purpose
- ✅ Export TypeScript source (`.ts`) for better DX
- ✅ Include proper `exports` field in `package.json`
- ✅ Use workspace protocol (`*`) for internal dependencies

### Authentication Flow

1. User visits TC app without session → redirected to `herald.todayscarolinian.com/login`
2. User enters credentials → Herald UI sends to Auth service
3. Auth service validates via BetterAuth → returns JWT token
4. Herald sets secure cookie (`.todayscarolinian.com`)
5. User redirected back to original app
6. App verifies session → grants access

### Authorization (ABAC)

Access control is position-based:

**Management Positions (User CRUD access):**

- EIC (Editor-in-Chief)
- MEA (Managing Editor for Administration)
- MED (Managing Editor for Development)
- CTO (Chief Technology Officer)
- DCTO (Deputy Chief Technology Officer)
- OME (Online Managing Editor)

**All Authenticated Users:**

- Dashboard access (read-only user directory)
- Self-service profile editing
- Password management

## 🌐 Deployment

### Vercel (Recommended)

Both apps are deployed on Vercel:

1. **Herald Core** (`apps/core`) → `herald.todayscarolinian.com`
2. **Herald Auth** (`apps/auth`) → `auth.todayscarolinian.com`

#### Deploy Herald UI

```bash
cd apps/core
vercel --prod
```

#### Deploy Herald Auth

```bash
cd apps/auth
vercel --prod
```

### Environment-Specific Deployments

**Development:**

- Firebase Project: `tc-herald-dev`
- URLs: `localhost:3000` / `herald-dev.vercel.app`

**Staging (Optional):**

- Firebase Project: `tc-herald-staging`
- URL: `herald-staging.vercel.app`

**Production:**

- Firebase Project: `tc-herald-prod`
- URLs: `herald.todayscarolinian.com` / `auth.todayscarolinian.com`

## 🔐 Environment Variables

### Herald Core (`apps/core/.env.local`)

```bash
# Firebase (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Application
NEXT_PUBLIC_APP_URL=https://herald.todayscarolinian.com
NEXT_PUBLIC_AUTH_API_URL=https://auth.todayscarolinian.com

# Vercel KV (Redis)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### Herald Auth (`apps/auth/.env.local`)

```bash
# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=

# BetterAuth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://auth.todayscarolinian.com

# Resend
RESEND_API_KEY=

# Vercel KV (Redis)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Application
SESSION_COOKIE_NAME=session
SESSION_MAX_AGE=432000              # 5 days (in seconds)
REMEMBER_ME_MAX_AGE=2592000         # 30 days (in seconds)
ALLOWED_ORIGINS=https://todayscarolinian.com,https://archives.todayscarolinian.com,https://uscdays.todayscarolinian.com,https://herald.todayscarolinian.com
```

## 🔒 Security Best Practices

Herald implements multiple security layers:

1. **BetterAuth** - Industry-standard authentication provider
2. **ABAC Middleware** - Position-based access control on protected routes
3. **Rate Limiting** - Prevent brute force attacks (Redis-backed)
4. **Input Validation** - Zod schemas on all user inputs
5. **Secure Cookies** - `httpOnly`, `secure`, `sameSite` flags
6. **Email Verification** - Required before first login
7. **Password Policies** - Minimum strength requirements
8. **CORS** - Enabled only for TC domains

### Security Checklist

- ✅ Never expose Firebase Admin credentials to client
- ✅ Always verify tokens server-side
- ✅ Use environment variables for secrets
- ✅ Enable CORS only for TC domains
- ✅ Sanitize all user inputs
- ✅ Log security events (failed logins, permission denials)
- ✅ Implement rate limiting on sensitive endpoints

## 📊 Monitoring & Observability

### Logging

- **BetterAuth Events**: Login attempts, password resets, account creations
- **Application Logs**: API errors, permission denials, rate limit hits
- **Audit Logs**: Admin actions stored in Firestore `auditLogs` collection

### Key Metrics to Track

- Active sessions
- Failed login attempts
- Password reset requests
- API response times
- Token verification latency
- Email delivery success rate

## 🤝 Contributing

### Branch Naming Convention

- `<TICKET-ID>` - For example: `AUTH-4`

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```shell
feat: add bulk user import via CSV
fix: resolve session expiration bug
docs: update deployment instructions
refactor: reorganize authentication middleware
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Run linting and formatting: `npm lint && npm format`
4. Test locally with both apps running
5. Submit PR with clear description
6. Wait for review and approval
7. Squash and merge

## Common Troubleshooting

### Installation Issues

**Problem:** `npm install` fails with peer dependency errors

```bash
# Solution: Use --legacy-peer-deps flag
npm install --legacy-peer-deps

# Or add to .npmrc
echo "legacy-peer-deps=true" >> .npmrc
```

**Problem:** `EACCES` permission errors on macOS/Linux

```bash
# Solution: Fix npm permissions or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Development Server Issues

**Problem:** Port 3000 or 3001 already in use

```bash
# Solution 1: Kill the process using the port (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Solution 2: Use different ports
npm --filter core dev -- --port 3002
```

**Problem:** Changes not reflecting in browser

```bash
# Solution: Clear Next.js cache and restart
rm -rf apps/core/.next
npm --filter core dev
```

**Problem:** "Module not found" errors for shared packages

```bash
# Solution: Rebuild and reinstall dependencies
npm clean
rm -rf node_modules
npm install
npm build
```

### Environment Variable Issues

**Problem:** Environment variables not loading

```bash
# Check .env.local exists in correct location
ls apps/core/.env.local
ls apps/auth/.env.local

# Ensure NEXT_PUBLIC_ prefix for client-side variables in Next.js
# ✅ NEXT_PUBLIC_API_URL=...
# ❌ API_URL=...

# Restart dev server after changing .env files
```

### Firebase Issues

**Problem:** "Firebase not initialized" errors

```bash
# Verify environment variables are set
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_PRIVATE_KEY

# Ensure private key is properly formatted (with \n for newlines)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**Problem:** Firestore permission denied errors

```bash
# Check Firestore rules in Firebase Console
# Development rules (for testing only):
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

### Build Issues

**Problem:** TypeScript errors during build

```bash
# Run type-check to see all errors
npm run typecheck

# Fix or temporarily skip (not recommended for production)
echo "SKIP_TYPE_CHECK=true" >> apps/core/.env.local
```

**Problem:** Build succeeds locally but fails on Vercel

```bash
# Ensure environment variables are set in Vercel dashboard
# Check build logs for specific errors
# Verify Node.js version matches (use .nvmrc file)
echo "18" > .nvmrc
```

### Session/Authentication Issues

**Problem:** Users not staying logged in

```bash
# Check cookie domain matches
# For localhost: domain should be undefined or 'localhost'
# For production: domain should be '.todayscarolinian.com'

# Verify SESSION_MAX_AGE is set correctly
echo $SESSION_MAX_AGE  # Should be 432000 (5 days)
```

**Problem:** "Invalid token" errors

```bash
# Clear browser cookies and try again
# Verify BETTER_AUTH_SECRET matches between deployments
# Check that auth service is accessible
curl https://auth.todayscarolinian.com/health
```

### Turborepo Issues

**Problem:** Turborepo cache causing stale builds

```bash
# Clear Turborepo cache
rm -rf .turbo
npm build

# Disable cache for debugging
npm build -- --no-cache
```

**Problem:** Tasks not running in correct order

```bash
# Check turbo.json for correct dependsOn configuration
# Shared packages should build before apps
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]  # ^ means dependencies first
    }
  }
}
```

### Getting Help

1. **Check logs:** Look at terminal output and browser console
2. **Verify environment:** Ensure all `.env.local` files are configured
3. **Search issues:** Check GitHub issues for similar problems
4. **Ask the team:** Send a message to the Herald Development group chat on Messenger
5. **Documentation:** Review official docs for Next.js, Hono, BetterAuth

## 📚 Additional Resources

- [System Overview](https://fine-vision-100.notion.site/1-System-Overview-312b953516bc812082ade2f2a7861483)
- [Software Design Document (SDD)](https://fine-vision-100.notion.site/Herald-Software-Design-Document-SDD-MVP-312b953516bc81aca1c0fc310708b241?pvs=74)
- [BetterAuth Documentation](https://www.better-auth.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/)
- [Turborepo Documentation](https://turborepo.dev/docs)

## 📄 License

Copyright © 2026 Today's Carolinian. All rights reserved.

---

**Built with ❤️ by the Today's Carolinian Development Team**
