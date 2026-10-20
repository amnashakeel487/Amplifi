# Amplifi • Social Media Content Management & Approval System

> Production-grade Social Media Content Management & Approval System with a polished, modern, SaaS UI (Linear, Notion, Asana, Vercel design aesthetic).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-RLS-3ECF8E.svg)](https://supabase.com/)

---

## 🌟 Highlights & Architecture

- **SaaS Design System**: Full Tailwind CSS design tokens, Indigo/Violet primary scale (`#4F46E5`), Slate neutrals, subtle layered soft shadows, 8px inputs/buttons, 12–16px cards, smooth 150–200ms transitions, and Framer Motion micro-interactions.
- **Color Theme**: Native Light and Dark mode with automatic system-preference detection and user persistence in `localStorage`.
- **15-State Content Workflow Machine**: Strict server-enforced state machine in PostgreSQL with audit logging:
  `Draft` → `Assigned` → `In Progress` → `Submitted` → `Under Review` → `Revision Required` → `Manager Approved` → `Pending Admin Approval` → `Approved` → `Ready to Publish` → `Scheduled` → `Published` (plus `Rejected`, `Cancelled`, `Failed Publishing`).
- **Tailored Role Views**:
  - **Administrator**: Operational command center with pipeline charts, overdue metrics, audit streams, backup management, user provisioning, and executive approval desk.
  - **Campaign Manager**: Kanban board with state-transition validation, drag-and-drop, proofreading queue, side-by-side review studio, and client filtering.
  - **Student / Creator**: "My Tasks" view sorted by due-soon milestones, required format checklists, drag-and-drop file upload zone, Drive link live validator, and actionable revision banners.
- **Enterprise Security & Disaster Recovery**:
  - Split-screen authenticated sign-in without public registration.
  - Dedicated `/admin` route with elevated Security PIN verification (`2026`).
  - Forced password change screen with a dynamic 5-segment password strength meter.
  - Row Level Security (RLS) PostgreSQL schema with role-based functions.
  - Guided 6-stage disaster recovery restore wizard with pre-restore safety snapshot and mandatory typed confirmation (`RESTORE`).
- **Google Cloud Workspace Integration**:
  - Server-side service account execution (Drive folder provisioning, permissions scanning, Docs brief sync).
  - Never displays green connected status unless backend verifies authentication.
- **Publishing Station**:
  - Manual publishing checklist card with quick copy buttons (caption, hashtags, media CDN), target account selector, published URL validator, and date-time picker.
  - Direct API connector stubs showing verified `Configuration Required` state until enterprise credentials pass validation.

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 2. Setup & Installation
```bash
# Clone and enter workspace
cd "d:/social media content management"

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
# Typecheck and compile bundle with Vite
npm run build

# Preview optimized production bundle
npm run preview
```

---

## 🔑 Demo Access & Roles

For instant testing, Amplifi includes built-in credentials and a top-bar **"Switch Role"** menu:

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@amplifi.io` | `AmplifiAdminSecure2026!` | Full executive access, Approval Queue, User Management, Backup & Disaster Recovery, Audit Logs |
| **Manager** | `sarah.manager@amplifi.io` | `AmplifiAdminSecure2026!` | Kanban board, proofreading studio (`/review/:id`), assignment creation, student feedback |
| **Student / Creator 1** | `alex.creator@amplifi.io` | `AmplifiAdminSecure2026!` | "My Tasks", asset uploads, caption drafting, revision resubmission |
| **Student / Creator 2** | `maya.design@amplifi.io` | `AmplifiAdminSecure2026!` | Graphic & video design assignments, Google Drive sync |
| **Client Observer** | `elena@acmefintech.io` | `AmplifiAdminSecure2026!` | Read-only access to approved posts and client campaigns |

*Admin Portal*: `/admin` (Default PIN: `2026`)

---

## 🗄️ Database & Security Architecture

PostgreSQL migrations and Row Level Security policies are located under `supabase/migrations/`:
- `supabase/migrations/20261020000000_init_schema.sql`: 12 tables, enums, triggers, and comprehensive RLS policies.
- `supabase/migrations/20261020000001_phase2_management.sql`: User, client, and project membership constraints.
- `supabase/migrations/20261020000002_workflow_state_machine.sql`: `validate_post_transition` and `execute_post_transition` stored procedure.
- `supabase/migrations/20261020000003_phase6_publishing_and_audit.sql`: Publishing jobs queue, automated scheduler polling, and audit logs.
- `supabase/seed.sql`: Seeds initial client workspaces, system settings, and demo brands.

### Server Edge Functions (`supabase/functions/`):
- `supabase/functions/google-drive-sync/index.ts`: Server-side proxy for Drive folder provisioning and permissions scanning.
- `supabase/functions/database-backup/index.ts`: Nightly cron backup creation and SHA-256 checksum calculation.

---

## ☁️ Google Cloud Workspace Setup Guide

To link production Google Drive and Google Docs integrations:

1. **Google Cloud Console**:
   - Create a project: `amplifi-workspace-prod`.
   - Enable **Google Drive API** and **Google Docs API**.
2. **Service Account Provisioning**:
   - Create a Service Account: `amplifi-service-worker@amplifi-workspace-prod.iam.gserviceaccount.com`.
   - Generate and download a JSON private key.
   - In Google Workspace Admin Console, grant Domain-Wide Delegation with scopes:
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/documents.readonly`
3. **Environment Configuration**:
   - In `.env`, populate `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
   - Specify `GOOGLE_DRIVE_ROOT_FOLDER_ID` for the parent workspace folder.

---

## 🔄 Disaster Recovery & Restore Runbook

Amplifi features a verified **6-Stage Guided Restore Wizard**:

1. **Select & Strategy**:
   - Choose snapshot archive from history.
   - Choose mode: **Full Replacement** (deterministic overwrite) or **Additive Merge** (preserves newer sessions).
2. **Validate**:
   - Verifies cryptographic SHA-256 checksum against cloud manifest.
   - Verifies PostgreSQL schema version compatibility.
   - Confirms foreign key integrity and asset pointer validity.
3. **Preview**:
   - Displays affected record counts across tables (Users, Clients, Projects, Posts, Comments, Audit Logs).
4. **Safety Snapshot**:
   - Automatically dumps an immediate pre-restore safety checkpoint before modifying tables.
5. **Confirm**:
   - Requires administrative PIN and typing `RESTORE` explicitly.
6. **Result**:
   - Atomically resets relations and logs the event in the audit trail.

---

## ⌨️ Global Features & UX

- <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd>: Opens Command Palette to quickly search and jump to any view, post, project, or switch theme.
- **Real-time Platform Limits**: Character and hashtag counters for Twitter/X (280), LinkedIn (3,000), Instagram (2,200 + 30 tags), TikTok (2,200), and Facebook (63,206).
- **Lightbox & Video Player**: Full-screen media preview with 1:1, 4:5, 9:16, 16:9 ratio tags, zoom controls, and HTML5 video playback.
- **Accessible & Responsive**: WCAG AA color contrast, keyboard tab navigation, visible focus rings, ARIA labels, and responsive drawer fallbacks on mobile.

---

## 📦 Phase Completion Status

- [x] **Phase 1 (Complete)**: Design system tokens, layout shell, auth screens, database schema, RLS policies, role-based routing, and admin bootstrap.
- [x] **Phase 2 (Complete)**: User management administration, client accounts with brand codes, project detail workspace with 6 tabs, and team assignments.
- [x] **Phase 3 (Complete)**: Posts directory, creation wizard, platform character counters, server-enforced state machine, and 2-column post detail page.
- [x] **Phase 4 (Complete)**: Google OAuth & Drive integration, folder tree browser, permissions scanner, link health audit, and student upload flow.
- [x] **Phase 5 (Complete)**: Google Docs live brief integration, side-by-side proofreading review studio (`/review/:id`), inline feedback suggestions, and manager sign-off.
- [x] **Phase 6 (Complete)**: Executive approval queue split review desk, manual publishing checklist card with live copy buttons, auto-publishing API connector stubs, and grouped activity notifications.
- [x] **Phase 7 (Complete)**: Prominent backup status cards, 6-stage guided disaster recovery restore wizard, multi-filter audit log ledger with inspection drawer, and Recharts analytics reports with CSV export.
- [x] **Phase 8 (Complete)**: Production hardening, build verification, server edge functions, environment variable documentation, and deployment guides.
