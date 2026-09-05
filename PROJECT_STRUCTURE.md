# Resumi Project Structure Guide

## Overview
The project has been reorganized to follow Next.js best practices with a clear separation of concerns and feature-based organization.

## Directory Structure

```
resumi/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes (RSC endpoints)
│   │   │   ├── ai/                   # AI-related endpoints
│   │   │   ├── applications/         # Application management
│   │   │   ├── jobs/
│   │   │   │   ├── route.ts          # List/create jobs
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts      # Get/update/delete job
│   │   │   │   │   └── apply/        # Job application endpoint
│   │   │   │   └── public/           # Public jobs endpoint (moved from root)
│   │   │   ├── messages/             # Messaging system
│   │   │   ├── notifications/        # Notifications
│   │   │   ├── profile/              # User profile
│   │   │   ├── resume/               # Resume management
│   │   │   └── user/                 # User endpoints
│   │   ├── (auth)/                   # Auth routes (Clerk)
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── dashboard/                # Main dashboard
│   │   ├── employer/                 # Employer portal
│   │   │   ├── candidates/
│   │   │   ├── dashboard/
│   │   │   ├── interviews/
│   │   │   ├── jobs/
│   │   │   └── post-job/
│   │   ├── for-employers/            # Public employer landing
│   │   ├── jobs/                     # Public job listings
│   │   ├── onboarding/               # User onboarding flow
│   │   ├── pricing/                  # Pricing page
│   │   ├── profile/                  # User profile page
│   │   ├── resume/                   # Resume builder
│   │   ├── saved/                    # Saved jobs/resumes
│   │   ├── u/[username]/             # Public user profiles
│   │   ├── upgrade/                  # Upgrade page
│   │   ├── companies/                # Companies directory
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   ├── globals.css               # Global styles
│   │   └── template.tsx              # Page template
│   │
│   ├── components/                   # React Components (organized by type)
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── dashboard/            # Dashboard feature components
│   │   │   │   ├── DashboardClient.tsx
│   │   │   │   ├── ResumeCard.tsx
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   ├── InboxDropdown.tsx
│   │   │   │   ├── JobBoard.tsx
│   │   │   │   ├── PdfUploader.tsx
│   │   │   │   └── HiringRoadmap.tsx
│   │   │   ├── employer/             # Employer portal components
│   │   │   │   ├── EmployerDashboardClient.tsx
│   │   │   │   ├── CandidatesClient.tsx
│   │   │   │   ├── InterviewsClient.tsx
│   │   │   │   ├── PostJobForm.tsx
│   │   │   │   ├── SendMessageClient.tsx
│   │   │   │   └── StatusSelector.tsx
│   │   │   ├── jobs/                 # Job-related components
│   │   │   │   └── ApplyButton.tsx
│   │   │   ├── profile/              # Profile components
│   │   │   │   ├── ProfileClient.tsx
│   │   │   │   ├── SavedClient.tsx
│   │   │   │   └── UpgradeClient.tsx
│   │   │   ├── resume/               # Resume builder components
│   │   │   │   ├── BuilderClient.tsx
│   │   │   │   ├── BuilderSidebar.tsx
│   │   │   │   ├── CanvasEditor.tsx
│   │   │   │   ├── PropertiesSidebar.tsx
│   │   │   │   ├── ResumeForm.tsx
│   │   │   │   └── ResumePreview.tsx
│   │   │   ├── landing/              # Landing page components
│   │   │   │   ├── LandingClient.tsx
│   │   │   │   └── AuroraBackground.tsx
│   │   │   └── onboarding/           # Onboarding components
│   │   │       └── OnboardingClient.tsx
│   │   │
│   │   ├── layout/                   # Layout/structural components
│   │   │   ├── PublicHeader.tsx      # Public site header
│   │   │   └── PublicFooter.tsx      # Public site footer
│   │   │
│   │   └── ui/                       # Reusable UI components
│   │       ├── Toast.tsx             # Toast notifications
│   │       ├── ConfirmModal.tsx      # Confirmation dialogs
│   │       └── ResumiLogo.tsx        # Logo component
│   │
│   ├── lib/                          # Utilities and helpers
│   │   ├── prisma.ts                 # Prisma client instance
│   │   ├── utils.ts                  # General utilities
│   │   ├── format.ts                 # Formatting functions
│   │   ├── ensure-user.ts            # User validation helpers
│   │   └── proxy.ts                  # Proxy utilities
│   │
│   ├── types/                        # TypeScript types and interfaces
│   │   ├── index.ts                  # Main type exports
│   │   ├── dashboard.ts              # Dashboard types
│   │   ├── employer.ts               # Employer types
│   │   └── pdf-parse.d.ts            # PDF parsing type definitions
│   │
│   └── constants/                    # App-wide constants
│
├── prisma/                           # Database schema and migrations
│   ├── schema.prisma                 # Prisma schema
│   ├── prisma.config.ts              # Prisma config (advanced)
│   └── migrations/                   # Database migrations
│
├── public/                           # Static assets
│   └── icon/                         # App icons
│
├── Configuration Files
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── next.config.ts                # Next.js configuration
│   ├── postcss.config.mjs            # PostCSS configuration
│   ├── eslint.config.mjs             # ESLint configuration
│   ├── package.json                  # Dependencies
│   ├── .env                          # Environment variables
│   └── .env.local                    # Local environment overrides
│
└── Documentation
    ├── README.md                     # Project README
    ├── LICENSE                       # License
    ├── AGENTS.md                     # AI/Agent configuration
    └── PROJECT_STRUCTURE.md          # This file
```

## Key Organization Principles

### 1. **Features-Based Component Organization** (`/components/features/`)
Components are grouped by feature/domain rather than type:
- `dashboard/` - All dashboard-related components
- `employer/` - All employer portal components
- `resume/` - All resume builder components
- etc.

**Benefits:**
- Easy to find all components for a specific feature
- Better code locality and maintainability
- Clearer feature boundaries

### 2. **Shared UI Components** (`/components/ui/`)
Reusable UI components used across multiple features:
- Toast notifications
- Modal dialogs
- Logo component
- Form elements (if any)

### 3. **Layout Components** (`/components/layout/`)
Global structural components:
- Header
- Footer
- Navigation
- Sidebar (if added)

### 4. **API Route Organization** (`/src/app/api/`)
Follows REST conventions:
- `/api/jobs/` - Job CRUD operations
- `/api/jobs/public/` - Public job listings (moved from root)
- `/api/applications/` - Application management
- `/api/messages/` - Messaging system
- `/api/notifications/` - Notifications

### 5. **Page Routes** (`/src/app/`)
Follows feature-based structure:
- `/dashboard` - User dashboard
- `/employer/*` - Employer portal
- `/resume/*` - Resume builder
- `/profile` - User profile
- `/jobs/*` - Job listings

## Import Path Conventions

### Feature Components
```typescript
// ✓ CORRECT
import DashboardClient from "@/components/features/dashboard/DashboardClient";
import PostJobForm from "@/components/features/employer/PostJobForm";

// ✗ OLD (now incorrect)
import DashboardClient from "@/components/dashboard/DashboardClient";
```

### UI Components
```typescript
// ✓ CORRECT
import { Toast } from "@/components/ui/Toast";
import ResumiLogo from "@/components/ui/ResumiLogo";

// ✗ OLD (now incorrect)
import ResumiLogo from "@/components/logo/ResumiLogo";
```

### Layout Components
```typescript
// ✓ CORRECT
import PublicHeader from "@/components/layout/PublicHeader";

// ✗ OLD (now incorrect)
import PublicHeader from "@/components/marketing/PublicHeader";
```

## Recent Changes

### Files Moved
- ✓ `route-public-jobs.ts` (root) → `src/app/api/jobs/public/route.ts`

### Directories Reorganized
- ✓ `/src/components/dashboard/` → `/src/components/features/dashboard/`
- ✓ `/src/components/employer/` → `/src/components/features/employer/`
- ✓ `/src/components/resume/` → `/src/components/features/resume/`
- ✓ `/src/components/profile/` → `/src/components/features/profile/`
- ✓ `/src/components/landing/` → `/src/components/features/landing/`
- ✓ `/src/components/onboarding/` → `/src/components/features/onboarding/`
- ✓ `/src/components/jobs/` → `/src/components/features/jobs/`
- ✓ `/src/components/marketing/` → `/src/components/layout/`
- ✓ `/src/components/logo/` → `/src/components/ui/`

### Import Paths Updated
- ✓ 19 app page files
- ✓ 12 component files (internal imports)
- ✓ 50+ total import statements

## Adding New Features

When adding a new feature:

1. **Create feature folder** in `/src/components/features/`
   ```
   src/components/features/my-feature/
   ├── MyFeatureClient.tsx
   ├── MyFeatureForm.tsx
   └── MyFeatureCard.tsx
   ```

2. **Create feature pages** in `/src/app/`
   ```
   src/app/my-feature/
   ├── page.tsx
   └── [id]/
       └── page.tsx
   ```

3. **Create API routes** if needed in `/src/app/api/`
   ```
   src/app/api/my-feature/
   └── route.ts
   ```

4. **Add types** to `/src/types/`
   ```
   src/types/my-feature.ts
   ```

## Best Practices

1. **Component Naming**: Use PascalCase for components, suffix with feature (e.g., `DashboardClient.tsx`)
2. **Imports**: Always use alias imports (`@/...`) for better refactoring
3. **File Organization**: Keep related files together in the same folder
4. **Type Safety**: Define types in `/src/types/` for better reusability
5. **Constants**: Store app-wide constants in `/src/constants/`

## Troubleshooting Import Errors

If you see import errors after editing:

1. Check that the file path matches the new structure
2. Verify the import uses `@/components/features/` for feature components
3. Ensure UI components use `@/components/ui/`
4. Layout components use `@/components/layout/`

Example fixes:
```typescript
// Before restructuring
import Button from "@/components/dashboard/Button";

// After restructuring (if Button moved to UI)
import Button from "@/components/ui/Button";
```

---

**Last Updated:** September 6, 2026
**Structure Version:** 2.0 (Reorganized with features-based approach)
