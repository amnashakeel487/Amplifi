import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  FileText,
  Share2,
  BarChart3,
  Layers,
  Clock,
  Sun,
  Moon,
  Check,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Zap,
  Users,
  Kanban,
  FileCheck,
  Globe,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { DeadlineChip } from '@/components/ui/deadline-chip';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'manager' | 'creator' | 'client'>('manager');

  const handleCta = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary-500/20 selection:text-primary-600 transition-colors">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-violet-500 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Amplifi
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900">
                v2.0 Enterprise
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Workflow Engine
            </a>
            <a href="#roles" className="hover:text-foreground transition-colors">
              Role Consoles
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Disaster Recovery
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>

            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Go to Workspace
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-xs"
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Launch App
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-500/10 dark:bg-primary-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-900 text-xs font-semibold text-primary-700 dark:text-primary-300 shadow-soft-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
            <span>Introducing Amplifi 2.0 • Precision Social Content Operations</span>
            <ChevronRight className="h-3.5 w-3.5 text-primary-500" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Content Operations Engineered for{' '}
            <span className="bg-gradient-to-r from-primary-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Precision & Scale.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The mission-critical content management, proofreading studio, and 15-stage workflow approval machine built for marketing agencies, student creators, and multi-brand enterprises.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              variant="primary"
              onClick={handleCta}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="text-sm px-6 h-12 shadow-soft-md hover:shadow-soft-lg"
            >
              {user ? 'Enter Workspace' : 'Open Production Workspace'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/admin')}
              leftIcon={<ShieldCheck className="h-4 w-4 text-primary-500" />}
              className="text-sm px-6 h-12"
            >
              Secure Admin Console
            </Button>
          </div>

          {/* Client Logos / Trust Bar */}
          <div className="pt-12 border-t border-border/40 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Trusted by multi-brand marketing teams & creative studios
            </span>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all text-xs font-bold font-mono tracking-widest text-muted-foreground">
              <span>ACME FINTECH</span>
              <span>PULSE CLEAN ENERGY</span>
              <span>KROMA FASHION</span>
              <span>NOVA STUDIOS</span>
              <span>APEX DIGITAL</span>
            </div>
          </div>

          {/* 3. HERO INTERACTIVE UI PREVIEW CARD */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-soft-lg overflow-hidden transition-all text-left">
              {/* Fake Browser Window Header */}
              <div className="h-10 border-b border-border/80 bg-muted/40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  app.amplifi.io/posts/post-01 • Autonomous Risk Modeling
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">Postgres WAL Sync</span>
                </div>
              </div>

              {/* Mockup Body: Two Column Post Studio Preview */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-card/40">
                {/* Left side: Content preview */}
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status="under_review" size="sm" />
                    <PriorityBadge priority="high" />
                    <DeadlineChip deadline={new Date(Date.now() + 86400000).toISOString()} />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-muted-foreground">Acme FinTech Global (ACME)</span>
                    <h3 className="text-lg font-bold text-foreground mt-0.5">
                      Autonomous Risk Modeling: The 2026 Algorithmic Frontier
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground leading-relaxed font-sans">
                    Traditional risk assessment models are blind to non-linear liquidity shocks. Autonomous risk engines operate on live order-book topology, safeguarding liquidity before volatility triggers cascade...
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-mono text-[11px]">#FinTech</span>
                    <span className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-mono text-[11px]">#AutonomousFinance</span>
                    <span className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-mono text-[11px]">#RiskArchitecture</span>
                  </div>
                </div>

                {/* Right side: Verification Badges */}
                <div className="md:col-span-4 rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3 text-xs">
                  <span className="font-semibold text-foreground uppercase tracking-wider block">
                    Pre-Flight Governance
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/40">
                      <span>Twitter / X (280)</span>
                      <span className="font-mono text-emerald-600 font-bold">184 / 280</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/40">
                      <span>Google Drive Folder</span>
                      <span className="font-mono text-emerald-600 font-bold">Verified</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/40">
                      <span>Google Docs Brief</span>
                      <span className="font-mono text-emerald-600 font-bold">Synced</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      Sign-Off & Forward to Admin
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SECTION */}
      <section id="features" className="py-24 border-t border-border/80 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Architectural Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Built for Absolute Certainty.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Every deliverable travels through an unbroken chain of custody from creator draft to public social dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-soft space-y-3 hover:border-primary-500/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center">
                <Kanban className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">15-State Workflow Machine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deterministic PostgreSQL state transition guards enforce permissions. Posts cannot skip steps or be published without authorized managerial sign-off.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-soft space-y-3 hover:border-primary-500/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Proofreading Studio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Side-by-side media and caption inspection. Inline markup suggestions, diff comparisons, and Google Docs strategic brief integration.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-soft space-y-3 hover:border-primary-500/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <HardDrive className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Google Cloud & Drive Sync</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated folder tree hierarchy, live folder permissions verification, link health auditor, and drag-and-drop chunk streaming submissions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-soft space-y-3 hover:border-primary-500/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Publishing & Copy Desk</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manual publishing checklist with 1-click caption, hashtag, and media copy buttons, real-time platform character counters, and API hooks.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-soft space-y-3 hover:border-primary-500/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">6-Stage Disaster Recovery</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nightly automated snapshots, SHA-256 cryptographic verification, pre-restore safety checkpoints, and guided restoration wizards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-soft space-y-3 hover:border-primary-500/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Executive Velocity Analytics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Recharts analytics tracking creator capacity allocations, review turnaround SLAs, project progress distribution, and CSV export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW STEPPER SECTION */}
      <section id="workflow" className="py-24 border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Deterministic Governance
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              From Creative Brief to Live Release
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A continuous, auditable pipeline ensuring quality, brand compliance, and on-time publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600">01. Ideation</span>
              <h4 className="text-sm font-bold text-foreground">Project & Brief</h4>
              <p className="text-[11px] text-muted-foreground">
                Manager binds creative brief, Google Docs strategy, and formats.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600">02. Creation</span>
              <h4 className="text-sm font-bold text-foreground">Asset Submission</h4>
              <p className="text-[11px] text-muted-foreground">
                Student uploads media or pastes Drive link with live validation.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600">03. Editorial</span>
              <h4 className="text-sm font-bold text-foreground">Proofreading Studio</h4>
              <p className="text-[11px] text-muted-foreground">
                Manager inspects side-by-side copy, suggests edits, or requests revision.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600">04. Sign-off</span>
              <h4 className="text-sm font-bold text-foreground">Executive Queue</h4>
              <p className="text-[11px] text-muted-foreground">
                Admin reviews deliverable desk, authorizes approval, or locks schedule.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card shadow-soft space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600">05. Release</span>
              <h4 className="text-sm font-bold text-foreground">Distribution Desk</h4>
              <p className="text-[11px] text-muted-foreground">
                Quality checklist sign-off, live permalink logging, and audit record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ROLE CONSOLES TABS SECTION */}
      <section id="roles" className="py-24 border-t border-border/80 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Role-Specific Experiences
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Every Stakeholder Gets Their Own View.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Engineered so that creators focus on making, managers focus on editing, and executives focus on approvals.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border border-border/80 bg-card p-1 shadow-soft">
              <button
                onClick={() => setActiveRoleTab('admin')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRoleTab === 'admin'
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Administrator
              </button>
              <button
                onClick={() => setActiveRoleTab('manager')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRoleTab === 'manager'
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Campaign Manager
              </button>
              <button
                onClick={() => setActiveRoleTab('creator')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRoleTab === 'creator'
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Student Creator
              </button>
              <button
                onClick={() => setActiveRoleTab('client')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRoleTab === 'client'
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Client Observer
              </button>
            </div>
          </div>

          {/* Tab content card */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-soft space-y-6">
            {activeRoleTab === 'admin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Executive Command Center</h3>
                    <p className="text-xs text-muted-foreground">System-wide operational governance & health</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                    Launch Console
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Executive Approvals</span>
                    <span className="font-bold text-foreground text-sm">Split Review Desk</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Disaster Recovery</span>
                    <span className="font-bold text-foreground text-sm">6-Stage Wizard</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Compliance Audit</span>
                    <span className="font-bold text-foreground text-sm">Immutable Ledger</span>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'manager' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Campaign Content Studio</h3>
                    <p className="text-xs text-muted-foreground">Kanban pipelines, proofreading queue & editorial review</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                    Open Studio
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Kanban Board</span>
                    <span className="font-bold text-foreground text-sm">Drag-and-Drop States</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Editorial Studio</span>
                    <span className="font-bold text-foreground text-sm">Inline Markup & Diffs</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Google Docs Sync</span>
                    <span className="font-bold text-foreground text-sm">Live Campaign Briefs</span>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'creator' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Creator Tasks & Submissions</h3>
                    <p className="text-xs text-muted-foreground">Focused student creator view sorted by deadlines</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                    View Tasks
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Drag & Drop Upload</span>
                    <span className="font-bold text-foreground text-sm">500MB Chunk Streaming</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Drive Link Validator</span>
                    <span className="font-bold text-foreground text-sm">Live Permission Check</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Revision Banners</span>
                    <span className="font-bold text-foreground text-sm">Actionable Feedback</span>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'client' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Client Brand Portal</h3>
                    <p className="text-xs text-muted-foreground">Read-only oversight of scheduled releases and brand compliance</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                    Client Preview
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Content Preview</span>
                    <span className="font-bold text-foreground text-sm">High-Res Lightbox</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Release Calendar</span>
                    <span className="font-bold text-foreground text-sm">Distribution Timeline</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
                    <span className="text-muted-foreground block">Brand Safety</span>
                    <span className="font-bold text-foreground text-sm">Verified Sign-Offs</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA SECTION */}
      <section className="py-24 border-t border-border/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Ready to Streamline Your Social Media Pipeline?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Experience the precision of enterprise-grade content management, proofreading, and automated governance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              variant="primary"
              onClick={handleCta}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="text-sm px-8 h-12"
            >
              Open Workspace
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/admin')}
              className="text-sm px-6 h-12"
            >
              Admin Portal
            </Button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-border/80 bg-muted/20 py-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">Amplifi Platform Inc.</span>
            <span>• © 2026 All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:underline">
              Back to Top
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
