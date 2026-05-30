# GhostStudio AI — Critical & High Fixes Audit

## Agent: Main Agent
## Task ID: audit-fixes-001

## Summary

All 14 issues from the comprehensive audit have been fixed. TypeScript compilation passes with 0 errors. Next.js build succeeds with 0 errors.

## Changes Made

### P0 — CRITICAL FIXES

1. **NEXTAUTH_SECRET + ENCRYPTION vars in .env** (`/home/z/my-project/.env`, `/home/z/my-project/.env.example`)
   - Added `NEXTAUTH_SECRET` with generated secure base64 string
   - Added `ENCRYPTION_KEY` with generated 32-byte hex string
   - Added `ENCRYPTION_SALT` with generated 16-byte hex string
   - Updated `.env.example` to document all required vars with clearer instructions and warnings

2. **Hardcoded encryption fallback removed** (`/home/z/my-project/src/lib/crypto.ts`)
   - `getEncryptionSalt()` now throws in production if `ENCRYPTION_SALT` is unset
   - `getEncryptionKey()` now throws in production if `ENCRYPTION_KEY` is unset
   - Removed `'dev-only-fallback-key-do-not-use-in-prod'` hardcoded fallback
   - Dev mode falls back to NEXTAUTH_SECRET with console warnings instead of silently using weak values

3. **Float → Decimal for financial fields** (`/home/z/my-project/prisma/schema.prisma` + 9 controller files)
   - Changed `Task.moneyCost` from `Float` to `Decimal`
   - Changed `FinanceAccount.balance` from `Float` to `Decimal`
   - Changed `Transaction.amount` from `Float` to `Decimal`
   - Changed `BudgetRule.limitAmount` from `Float` to `Decimal`
   - Changed `FinancialGoal.targetAmount` from `Float` to `Decimal`
   - Changed `FinancialGoal.currentAmount` from `Float` to `Decimal`
   - Updated controllers: accounts, transactions, budget-rules, financial-goals, tasks, tasks/[taskId]
   - Updated AI routes: agent-run, analyze, audit-finances, suggest, optimize-schedule
   - Used `new Prisma.Decimal()` for creation, `.toString()` for JSON serialization, `.toNumber()` for arithmetic

4. **Evaluate action restricted to admin-only** (`/home/z/my-project/src/app/api/browser/interact/route.ts`)
   - Removed `evaluate` from standard `interactSchema`
   - Added separate `evaluateSchema` with `z.literal("evaluate")` action
   - `evaluate` action now requires `requireRole(request, "admin")`
   - Other actions require `requireRole(request, "operator")`
   - Replaced raw `getServerSession` with `requireRole`

### P1 — HIGH FIXES

5. **Zod validation for AI routes** (`/home/z/my-project/src/app/api/ai/chat/route.ts`, `/home/z/my-project/src/app/api/ai/agent-run/route.ts`)
   - Chat route: Added `chatRequestSchema` with messages capped at 50, content max 10000 chars
   - Agent-run route: Added `agentRunRequestSchema` with input max 10000 chars

6. **Zod validation for workspace PATCH** (`/home/z/my-project/src/app/api/workspaces/[id]/route.ts`)
   - Added `patchWorkspaceSchema` validating name (1-200 chars), type (enum), autonomousLevel (1-5)

7. **Zod validation for proxy routes** (4 files)
   - `/api/clip/generate`: Added `clipGenerateSchema` with jobId, videoUrl, cropMode, outputRatio
   - `/api/heatmap/scan`: Added `heatmapScanSchema` with videoUrl, resolution
   - `/api/image/generate`: Added `imageGenerateSchema` with prompt (5000 max), width, height
   - `/api/tts/synthesize`: Added `ttsSynthesizeSchema` with text (10000 max), voiceId

8. **Unified auth patterns** (12 route files replaced `getServerSession` with `requireAuth`)
   - `/api/ai/chat/route.ts` → `requireAuth`
   - `/api/ai/agent-run/route.ts` → `requireAuth`
   - `/api/ai/analyze/route.ts` → `requireAuth`
   - `/api/ai/audit-finances/route.ts` → `requireAuth`
   - `/api/ai/optimize-schedule/route.ts` → `requireAuth`
   - `/api/ai/suggest/route.ts` → `requireAuth`
   - `/api/browser/interact/route.ts` → `requireRole`
   - `/api/browser/screenshot/route.ts` → `requireAuth`
   - `/api/browser/session/[id]/route.ts` → `requireAuth`
   - `/api/browser/platform-action/route.ts` → `requireAuth`
   - `/api/browser/route.ts` → `requireAuth`
   - `/api/stripe/checkout/route.ts` → `requireAuth`
   - `/api/user/route.ts` → `requireAuth`
   - `/api/subscriptions/route.ts` → `requireAuth`

9. **Slug uniqueness per workspace** (`/home/z/my-project/prisma/schema.prisma`)
   - Added `@@unique([workspaceId, slug])` to `ContentItem` model

10. **TikTokCampaign and HeatmapClipJob workspaceId relations** (`/home/z/my-project/prisma/schema.prisma`)
    - Added `workspace Workspace? @relation(...)` to `HeatmapClipJob`
    - Added `workspace Workspace? @relation(...)` to `TikTokCampaign`
    - Added `heatmapClipJobs` and `tikTokCampaigns` to `Workspace` model

### P2 — MEDIUM FIXES

11. **CSP header** (`/home/z/my-project/next.config.ts`)
    - Added `Content-Security-Policy` header with proper directives:
      - default-src, script-src, style-src, font-src, img-src, connect-src, frame-src, object-src, base-uri, form-action, frame-ancestors

12. **SessionProvider type error** (`/home/z/my-project/src/components/providers/auth-provider.tsx`)
    - The original code was already correct for next-auth v4; no React 19 type incompatibility was found. Kept as-is.

13. **Daily cycle platform-aware** (`/home/z/my-project/src/lib/scheduler.ts`)
    - Replaced hardcoded `platform: 'wordpress'` with dynamic platform resolution
    - Now reads from content variants first, then workspace settingsJson.defaultPlatform
    - Falls back to 'wordpress' only if no configured platform is found

14. **Memory expiration cleanup** (`/home/z/my-project/src/lib/memory-system.ts`)
    - Added `cleanupExpired()` method to `MemorySystem` class
    - Promotes expired short-term memories to long-term (preserves data)
    - Deletes memories older than 90 days past expiration
    - Added standalone `cleanupExpiredMemories()` function for global/workspace-scoped cleanup

## Verification

- ✅ `npx tsc --noEmit` — 0 errors
- ✅ `npx next build` — succeeds with 0 errors
- ✅ `bun run db:push` — schema pushed successfully
