# BioWallet Deep Audit Report

**Task ID**: 1-b  
**Auditor**: Senior Security & Code Quality Agent  
**Date**: 2026-03-04  
**Repo**: `/home/z/my-project/BioWallet/`  
**Version**: 1.1.0  

---

## Executive Summary

BioWallet is a biometric-powered cryptocurrency wallet monorepo (mobile + web + backend). The audit uncovered **52 issues** across 6 categories: 13 Critical, 18 High, 14 Medium, 7 Low. The project is **NOT production-ready**. The most severe finding is that the authentication middleware does not actually verify JWTs — any string of 10+ characters passes auth. The biometric key derivation does not use real biometric entropy. The mobile app never calls the backend API. Several critical features are placeholders/stubs.

---

## 1. SECURITY AUDIT

### 1.1 CRITICAL: Authentication Middleware Does NOT Verify JWTs

**File**: `backend/api/src/middleware/auth.ts`  
**Lines**: 8-34

```typescript
// Line 23-28: "In production, verify the JWT token here"
// For now, we check that a non-empty token is provided
if (token.length < 10) {
  res.status(401).json({ message: 'Invalid or expired token' });
  return;
}
// Line 32: Just attaches the raw token string
(req as any).user = { token };
```

**Impact**: Any request with `Authorization: Bearer <any-10+char-string>` passes authentication. The `jsonwebtoken` dependency is listed in `package.json` but NEVER USED. There is zero JWT verification, zero token expiry checking, zero user identity resolution. Every authenticated endpoint is effectively public.

**Severity**: CRITICAL

---

### 1.2 CRITICAL: Biometric Key Derivation Uses NO Real Biometric Entropy

**File**: `apps/mobile/src/context/WalletContext.tsx`  
**Lines**: 83-87

```typescript
const biometricEntropy = `biometric-entropy-${deviceId}`;
const salt = 'biowallet-salt-v1';
const wallet = await coreGenerateWallet(biometricEntropy, salt);
```

**Impact**: The "biometric" key derivation is entirely based on the `deviceId` (a UUID stored in SecureStore) and a hardcoded salt. The actual biometric scan result is only used as a gate (yes/no authentication) — the biometric data itself contributes ZERO entropy to the private key. Anyone who obtains the `deviceId` (also stored in SecureStore) can regenerate the wallet private key without any biometric authentication.

**Contradicts documentation**: `ARCHITECTURE.md` describes "Argon2/BKDF key derivation from biometric hash" and "error correction for biometric variations" — none of this exists.

**Severity**: CRITICAL

---

### 1.3 CRITICAL: Hardcoded Static Salt for Key Derivation

**File**: `apps/mobile/src/context/WalletContext.tsx`  
**Lines**: 85-86, 130-131

```typescript
const salt = 'biowallet-salt-v1';  // Used in BOTH generateWallet and sendTransaction
```

**File**: `apps/web/src/pages/register.tsx`  
**Line**: 57, `apps/web/src/pages/login.tsx`  
**Line**: 22, `apps/web/src/pages/dashboard.tsx`  
**Line**: 38

**Impact**: Every user on every device uses the same salt. Combined with the non-biometric entropy source, all wallets are deterministic from a single `deviceId`. If the salt is changed, all existing wallets become unrecoverable.

**Severity**: CRITICAL

---

### 1.4 CRITICAL: Admin Auth Fallback Bypasses API Key Check

**File**: `backend/api/src/middleware/auth.ts`  
**Lines**: 60-67

```typescript
if (!expectedAdminKey) {
  // If no admin key is configured, require at least a valid auth token
  // In production, ADMIN_API_KEY must be set in environment
  console.warn('WARNING: ADMIN_API_KEY not set. Admin routes are less secure.');
} else if (adminApiKey !== expectedAdminKey) {
  res.status(403).json({ message: 'Admin access denied. Invalid API key.' });
  return;
}
```

**Impact**: If `ADMIN_API_KEY` env var is not set, the admin API key check is completely skipped. Since the auth middleware doesn't verify JWTs (see 1.1), any Bearer token of 10+ chars grants admin access. All admin endpoints (`/api/admin/stats`, `/api/admin/stats/daily`, `/api/admin/stats/users`, `/api/admin/stats/volume`) and user listing (`GET /api/users`) are exposed.

**Severity**: CRITICAL

---

### 1.5 HIGH: CORS Default Allows All Origins

**File**: `backend/api/src/index.ts`  
**Lines**: 20-24

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-API-Key'],
}));
```

**Impact**: Default `origin: '*'` allows any website to make cross-origin requests to the API. Combined with broken auth, this enables CSRF-style attacks from any domain.

**Severity**: HIGH

---

### 1.6 HIGH: In-Memory Rate Limiter — Trivially Bypassable

**File**: `backend/api/src/middleware/rateLimiter.ts`  
**Lines**: 12-58

```typescript
const rateLimitMap = new Map<string, RateLimitEntry>();
// ...
const ip = req.ip || req.connection.remoteAddress || 'unknown';
```

**Impact**: 
1. In-memory only — resets on server restart, doesn't work in multi-instance deployments
2. Uses `req.ip` which can be spoofed via `X-Forwarded-For` header (no `app.set('trust proxy', ...)` configured)
3. Key is `ip:path` — an attacker can rotate paths or use different IP headers to bypass
4. No rate limiting on the wallet registration endpoint (`POST /api/wallet/register`) — only `strictRateLimiter` on creation

**Severity**: HIGH

---

### 1.7 HIGH: No CSRF Protection

**File**: `backend/api/src/index.ts` — entire file

The backend has no CSRF token mechanism. State-changing operations (POST/PUT/DELETE) can be triggered by cross-origin requests. Combined with `cors: '*'`, any malicious website can:
- Register wallets
- Create transactions
- Update user profiles

**Severity**: HIGH

---

### 1.8 HIGH: No Input Validation with Zod Despite Being Listed as Dependency

**File**: `backend/api/package.json` — `zod` is listed as a dependency  
**Files**: All controllers in `backend/api/src/controllers/`

None of the controllers use Zod for input validation. All request body fields are directly used from `req.body` without schema validation:

```typescript
// userController.ts line 8
const { walletAddress, publicKey, email, deviceId, biometricType, referredBy } = req.body;
// No Zod schema validation anywhere
```

**Impact**: SQL injection via Prisma is unlikely, but type coercion, unexpected field types, and missing field validation can cause runtime errors or unexpected behavior.

**Severity**: HIGH

---

### 1.9 HIGH: Hardcoded Database Credentials in docker-compose.yml

**File**: `docker-compose.yml`  
**Lines**: 9-11

```yaml
environment:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  POSTGRES_DB: biowallet
```

**And line 26**:
```yaml
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/biowallet
```

**Impact**: Default credentials `postgres:postgres` in production config. No `.env` file exists for the backend.

**Severity**: HIGH

---

### 1.10 MEDIUM: Private Key Material Stored in React State / localStorage

**File**: `apps/web/src/context/WalletContext.tsx`  
**Lines**: 49-52

```typescript
const wallet = await coreGenerateWallet(biometricData, salt);
localStorage.setItem('walletAddress', wallet.address);
```

While only the address is stored in localStorage (not the private key), the private key is held in React state during the session. More critically, the `biometricData` parameter (which IS the seed for the private key) is passed around in React context and derived from values stored in `localStorage` (`credentialId`, `biowallet_local_secret`).

**File**: `apps/web/src/pages/register.tsx`  
**Lines**: 48-53

```typescript
if (!(credential as any).clientExtensionResults?.prf?.results?.first) {
  let localSecret = localStorage.getItem('biowallet_local_secret');
  if (!localSecret) {
    localSecret = ethers.hexlify(ethers.randomBytes(32));
    localStorage.setItem('biowallet_local_secret', localSecret);
  }
}
```

**Impact**: `biowallet_local_secret` stored in localStorage — any XSS can extract it and regenerate the wallet private key.

**Severity**: MEDIUM

---

### 1.11 MEDIUM: No Helmet Content Security Policy

**File**: `backend/api/src/index.ts`  
**Line**: 25

```typescript
app.use(helmet());
```

Default helmet is used without CSP configuration. This allows inline scripts and external resource loading, enabling XSS attack vectors.

**Severity**: MEDIUM

---

### 1.12 MEDIUM: `strictRateLimiter` Not Applied to Most Routes

**File**: `backend/api/src/routes/walletRoutes.ts`

```typescript
router.post('/register', strictRateLimiter, registerWallet);
router.get('/balance/:address', authMiddleware, getWalletBalance);
router.get('/transactions/:address', authMiddleware, getWalletTransactions);
```

Only the wallet registration POST has strict rate limiting. The balance and transaction GET endpoints have only the default (weak) rate limiter. Since auth is broken (1.1), these endpoints can be used to enumerate all wallet balances and transaction histories.

**Severity**: MEDIUM

---

### 1.13 LOW: Error Messages Leak Internal Details

**File**: `backend/api/src/index.ts`  
**Lines**: 47-53

```typescript
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

In development mode, raw error messages are returned. The `NODE_ENV` in `docker-compose.yml` is set to `development`.

**Severity**: LOW

---

## 2. LOGIC AUDIT

### 2.1 CRITICAL: Mobile App Never Calls Backend API

**Files**: All mobile context files

The mobile app has zero HTTP/fetch calls to the backend API. All wallet operations (generation, balance, send) are performed client-side only:
- `WalletContext.tsx` creates wallets locally and queries blockchain directly
- `AuthContext.tsx` manages auth entirely in SecureStore — no backend registration
- `HistoryScreen.tsx` has `loadTransactions()` that just returns `[]` with a comment "Placeholder: In production, fetch from /api/transactions"
- `HomeScreen.tsx` copy button does nothing (line 125: `// This would be implemented in a real app`)

**Impact**: The mobile app is a standalone client. Backend user/wallet/transaction registration never happens. If the mobile user loses their device, there is no recovery mechanism on the backend.

**Severity**: CRITICAL

---

### 2.2 CRITICAL: Duplicate User Creation Between `/api/users` and `/api/wallet/register`

**File**: `backend/api/src/controllers/userController.ts` — `createUser()`  
**File**: `backend/api/src/controllers/walletController.ts` — `registerWallet()`

Both endpoints create a `User` record with the same fields (`walletAddress`, `publicKey`, `biometricType`, `deviceId`, `email`, `referralCode`). The web app calls `POST /api/users` during registration (via `AuthContext.register()`), while `POST /api/wallet/register` exists but is never called by any frontend.

**Impact**: Two code paths for user creation with no deduplication. If both are called, the second will fail with a unique constraint error on `walletAddress`.

**Severity**: CRITICAL (Logic error)

---

### 2.3 HIGH: IDOR Vulnerability — No Ownership Checks on Any Endpoint

**File**: `backend/api/src/controllers/userController.ts` — `getUserById()`  
**Lines**: 53-89

```typescript
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { id: identifier },
      { walletAddress: identifier }
    ]
  },
```

Any authenticated user (which, per 1.1, is anyone with a 10+ char string) can look up any user by ID or wallet address. Same issue in:
- `updateUser()` — can update any user's `isPremium`, `email`, `deviceId`
- `getWalletBalance()` — can check any wallet balance
- `getWalletTransactions()` — can view any wallet's transactions
- `getTransactionById()` — can view any transaction

**Severity**: HIGH

---

### 2.4 HIGH: Transaction Creation Doesn't Verify Sender Ownership

**File**: `backend/api/src/controllers/transactionController.ts`  
**Lines**: 9-93

```typescript
const { fromAddress, toAddress, amount, signedTransaction, userId } = req.body;
```

The `userId` is taken directly from the request body — not from the auth token. Since auth doesn't verify identity, anyone can create transactions attributed to any user. There is no verification that `fromAddress` belongs to the authenticated user.

**Severity**: HIGH

---

### 2.5 HIGH: AdminStats Uses Fixed ID '1' — Singleton Pattern Broken

**File**: `backend/api/src/controllers/transactionController.ts`  
**Lines**: 45-60

```typescript
await prisma.adminStats.upsert({
  where: {
    id: '1' // Using a fixed ID for simplicity
  },
```

**Impact**: All transactions update a single row with `id: '1'`. If the row doesn't exist on first run, it's created. But this is fragile and will fail if the `id` field is UUID-based (it is — `@default(uuid())`). Prisma's `upsert` on a UUID field with value `'1'` will fail at the database level.

**Severity**: HIGH

---

### 2.6 MEDIUM: Web Auth Context Stores User ID as Auth Token

**File**: `apps/web/src/context/AuthContext.tsx`  
**Line**: 84

```typescript
localStorage.setItem('userToken', userData.id);
```

After registration, the backend returns `{ id: user.id, ... }` and the web app stores `userData.id` (a UUID) as the "userToken". This is then sent as a Bearer token in subsequent requests. Since the backend auth just checks `token.length >= 10` (see 1.1), this works — but it's essentially using the user's UUID as a permanent, non-expiring, non-verifiable token.

**Severity**: MEDIUM

---

### 2.7 MEDIUM: Referral Code Generation Is Not Cryptographically Secure

**File**: `backend/api/src/controllers/userController.ts`  
**Line**: 25

```typescript
const referralCode = `BIO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
```

`Math.random()` is not cryptographically secure. Referral codes could be predicted or collide.

**Severity**: MEDIUM

---

### 2.8 MEDIUM: Transaction Confirmation Listener Has No Error Handling

**File**: `backend/api/src/controllers/transactionController.ts`  
**Lines**: 69-89

```typescript
provider.once(tx.hash, async (receipt) => {
  if (receipt.status === 1) {
    await prisma.transaction.update({ ... });
  } else {
    await prisma.transaction.update({ ... });
  }
});
```

If the Prisma update fails inside the async callback, the error is silently swallowed. There's no timeout — if the transaction is never mined (e.g., dropped from mempool), the transaction stays `PENDING` forever.

**Severity**: MEDIUM

---

### 2.9 LOW: `getTransactionHistory` in wallet-core Scans Last 10 Blocks Only

**File**: `packages/wallet-core/src/index.ts`  
**Lines**: 91-119

```typescript
for (let i = 0; i < 10; i++) {
  if (blockNumber - i < 0) break;
  const block = await provider.getBlock(blockNumber - i);
```

This scans only the last 10 blocks for transactions matching an address. Since Sepolia produces ~7000 blocks/day, this covers only ~30 seconds of history. This function is never actually called by any frontend.

**Severity**: LOW

---

## 3. DATABASE AUDIT

### 3.1 HIGH: No Database Indexes Defined

**File**: `backend/db/schema.prisma`

The schema has no `@@index` or `@@unique` composite indexes. Critical missing indexes:

| Table | Missing Index | Impact |
|-------|---------------|--------|
| Transaction | `userId` | Slow queries for user transactions |
| Transaction | `fromAddress` | Slow lookups by sender |
| Transaction | `toAddress` | Slow lookups by receiver |
| Transaction | `createdAt` | Slow date-range queries (used heavily in admin) |
| Transaction | `status` | Slow status filtering |
| ReferralReward | `userId` | Slow user reward lookups |
| User | `email` | Has `@unique` but no explicit index (Prisma creates implicit) |

**Severity**: HIGH

---

### 3.2 HIGH: No Migrations Directory

There is no `prisma/migrations/` directory. Only `schema.prisma` exists. The backend `package.json` has `prisma:migrate` script but no migrations have been created. Database state is unknown.

**Severity**: HIGH

---

### 3.3 MEDIUM: `amount` and `fee` Use Float — Precision Loss for Crypto

**File**: `backend/db/schema.prisma`  
**Lines**: 34-36

```prisma
amount          Float
fee             Float
```

**And in ReferralReward**:
```prisma
amount          Float
```

**Impact**: IEEE 754 floating point cannot precisely represent many decimal values. For ETH amounts (18 decimal places), this causes rounding errors. Should use `Decimal` type or store as string/BigInt of wei.

**Severity**: MEDIUM

---

### 3.4 MEDIUM: Missing Relations

**File**: `backend/db/schema.prisma`

- `Transaction.fromAddress` and `Transaction.toAddress` are plain `String` — no relation to `User.walletAddress`
- `User.referredBy` is a plain `String` — no foreign key to another User's `referralCode`
- No relation between `AdminStats` and any other model

**Impact**: Referential integrity is not enforced at the database level. Transactions can reference non-existent wallet addresses.

**Severity**: MEDIUM

---

### 3.5 MEDIUM: `AdminStats` Model Design Is Poor

**File**: `backend/db/schema.prisma`  
**Lines**: 59-67

```prisma
model AdminStats {
  id                String    @id @default(uuid())
  totalUsers        Int       @default(0)
  totalTransactions Int       @default(0)
  totalVolume       Float     @default(0)
  totalFees         Float     @default(0)
  date              DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

- `id` is UUID but code uses `'1'` as ID (see 2.5)
- No `@@unique` on `date` — multiple stats rows for same date possible
- Should be a daily aggregation table but has no date constraint
- `totalUsers` is never updated from code — only `totalTransactions`, `totalVolume`, `totalFees`

**Severity**: MEDIUM

---

### 3.6 LOW: `deviceId` Not Unique

**File**: `backend/db/schema.prisma`  
**Line**: 18

```prisma
deviceId          String?
```

No `@unique` constraint. Multiple users can share the same deviceId, which is the key input for wallet generation on mobile (see 1.2).

**Severity**: LOW

---

## 4. CODE QUALITY AUDIT

### 4.1 HIGH: React Version Mismatch — Mobile vs Root vs Web

| Package | React Version |
|---------|--------------|
| Root `package.json` | `react: 19.0.0` |
| Web `package.json` | `react: 19.0.0` |
| Mobile `package.json` | `react: 18.2.0` |

Expo SDK 48 requires React 18.2.0. The root workspace pins React 19.0.0, which will conflict with Expo's requirements.

**Severity**: HIGH

---

### 4.2 HIGH: `react-native-get-random-values` Not in Mobile Dependencies

**File**: `apps/mobile/src/context/AuthContext.tsx`  
**Line**: 5

```typescript
import 'react-native-get-random-values';
```

This import is required for `uuid`'s `v4()` to work in React Native. However, `react-native-get-random-values` is NOT listed in `apps/mobile/package.json` dependencies. This will crash at runtime.

**Severity**: HIGH

---

### 4.3 HIGH: `react-native-qrcode-svg` Not in Mobile Dependencies

**File**: `apps/mobile/src/screens/HomeScreen.tsx`  
**Line**: 6

```typescript
import QRCode from 'react-native-qrcode-svg';
```

`react-native-qrcode-svg` is NOT listed in `apps/mobile/package.json`. This will cause a build failure.

**Severity**: HIGH

---

### 4.4 HIGH: `react-native-biometrics` Not Used But Listed as Dependency

**File**: `apps/mobile/package.json`  
**Line**: 26

```json
"react-native-biometrics": "^3.0.0",
```

This package is listed but never imported anywhere. The mobile app uses `expo-local-authentication` instead. Dead dependency.

**Severity**: LOW (unused dep)

---

### 4.5 HIGH: `utils` Package Has No `ethers` Dependency But Imports It

**File**: `packages/utils/src/index.ts`  
**Line**: 1

```typescript
import { ethers } from 'ethers';
```

**File**: `packages/utils/package.json`

```json
{
  "name": "utils",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": { "build": "tsc" }
}
```

No `dependencies` field at all. `ethers` is imported but not declared. This will fail at runtime unless `ethers` is hoisted from another workspace package.

**Severity**: HIGH

---

### 4.6 HIGH: `biometric-core` Imports `@simplewebauthn/server` But It's Browser-Only Code

**File**: `packages/biometric-core/src/index.ts`  
**Line**: 1

```typescript
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
```

**File**: `packages/biometric-core/package.json`

```json
"dependencies": {
  "@simplewebauthn/browser": "^7.0.0",
  "@simplewebauthn/server": "^7.0.0",
```

`@simplewebauthn/server` is listed but never imported. `@simplewebauthn/browser` is imported — but this package is meant for browser environments only. The `biometric-core` package is used by both mobile and web apps. The mobile app uses `expo-local-authentication`, NOT `biometric-core`. So `biometric-core` is effectively web-only despite being a "shared" package.

**Severity**: MEDIUM

---

### 4.7 MEDIUM: Web App Uses `localStorage` for Sensitive Data — No Server-Side Rendering Safety

**Files**: `apps/web/src/context/AuthContext.tsx`, `apps/web/src/context/WalletContext.tsx`

Both contexts use `localStorage` directly in `useEffect` and in callback functions. Next.js pages may be server-rendered, and `localStorage` is not available on the server. This will cause hydration mismatches and potential SSR crashes.

**Severity**: MEDIUM

---

### 4.8 MEDIUM: `ProfileScreen` Calls `toggleTheme` Which Doesn't Exist

**File**: `apps/mobile/src/screens/ProfileScreen.tsx`  
**Line**: 9

```typescript
const { colors, isDark, toggleTheme } = useTheme();
```

But `ThemeContext.tsx` exports:
```typescript
interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  colors: { ... };
}
```

There is no `toggleTheme` method. This will cause a runtime error when the theme toggle button is pressed.

**Severity**: MEDIUM

---

### 4.9 MEDIUM: `ethers.scrypt()` Parameters May Not Work in All Environments

**File**: `packages/wallet-core/src/index.ts`  
**Line**: 20

```typescript
const derivedKey = await ethers.scrypt(password, saltBytes, 16384, 8, 1, 32);
```

`ethers.scrypt` with N=16384 is computationally expensive. In browser environments, this may:
1. Block the main thread for several seconds
2. Fail on mobile devices with limited memory
3. Not be supported in all browser environments

The same issue exists in `packages/biometric-core/src/index.ts` line 126 and `packages/utils/src/index.ts`.

**Severity**: MEDIUM

---

### 4.10 MEDIUM: Web `AuthContext.login()` Return Type Doesn't Match Mobile

**File**: `apps/web/src/context/AuthContext.tsx`  
**Lines**: 99, 131-134

```typescript
const login = async (): Promise<{ success: boolean; credentialId?: string; clientExtensionResults?: any }> => {
  // ...
  return {
    success: true,
    credentialId: credential.id,
    clientExtensionResults: (credential as any).clientExtensionResults
  };
```

**File**: `apps/mobile/src/context/AuthContext.tsx`  
**Lines**: 97

```typescript
const login = async (): Promise<boolean> => {
```

The two platforms have completely different return types for the same logical operation. The dashboard page (`dashboard.tsx`) uses the web return type:

```typescript
const authResult = await login();
if (!authResult.success || !authResult.credentialId) {  // This wouldn't compile against mobile type
```

**Severity**: MEDIUM

---

### 4.11 MEDIUM: Web `sendTransaction` Signature Different from Mobile

**File**: `apps/web/src/context/WalletContext.tsx`  
**Line**: 65

```typescript
sendTransaction: (to: string, amount: string, biometricData: string, salt: string) => Promise<string | null>;
```

**File**: `apps/mobile/src/context/WalletContext.tsx`  
**Line**: 13

```typescript
sendTransaction: (to: string, amount: string) => Promise<string | null>;
```

The web version requires `biometricData` and `salt` parameters (re-derives wallet), while mobile re-derives internally. This means `dashboard.tsx` calling `sendTransaction(recipient, amount, entropySource, salt)` will fail on mobile.

**Severity**: MEDIUM

---

### 4.12 LOW: `@simplewebauthn/server` Version Mismatch

**File**: `packages/biometric-core/package.json` → `"@simplewebauthn/server": "^7.0.0"`  
**File**: `apps/web/package.json` → `"@simplewebauthn/server": "^7.4.0"`

Different version ranges. Could lead to different actual versions being installed.

**Severity**: LOW

---

### 4.13 LOW: `shared-ui` Package Is Unused

**File**: `packages/shared-ui/src/index.tsx`

Exports `Button` and `Card` components using HTML `<button>` and `<div>` with Tailwind classes. These are web-only components and are not imported by any file in the monorepo.

**Severity**: LOW

---

### 4.14 LOW: TypeScript `target: es5` in Web tsconfig

**File**: `apps/web/tsconfig.json`  
**Line**: 3

```json
"target": "es5"
```

Next.js 15 requires ES2017+ target. `es5` target may cause issues with async/await, `Set`, `Map`, etc.

**Severity**: LOW

---

## 5. FEATURE COMPLETENESS AUDIT

### 5.1 Mobile App Screens

| Screen | File | What Works | What's Placeholder/Stub |
|--------|------|------------|------------------------|
| Welcome | `WelcomeScreen.tsx` | UI renders, navigates to Register | Pure marketing page |
| Register | `RegisterScreen.tsx` | Biometric prompt works, wallet generates locally | No backend registration, biometric entropy is fake (deviceId-based) |
| Login | `LoginScreen.tsx` | Biometric prompt works, wallet recovers locally | No backend authentication, token is a random UUID |
| Home | `HomeScreen.tsx` | Balance from blockchain, QR code, address display | Copy button is empty (`// This would be implemented`), Quick Actions buttons don't navigate, no receive flow |
| Send | `SendScreen.tsx` | Form validates, sends ETH via ethers.js | No gas estimation, no ENS resolution, no address book, errors not user-friendly |
| History | `HistoryScreen.tsx` | UI renders with empty state | `loadTransactions()` returns `[]` — **NEVER FETCHES REAL DATA**, comment says "In production, fetch from /api/transactions" |
| Profile | `ProfileScreen.tsx` | Theme toggle (broken — see 4.8), logout works | Security & Notifications settings show "coming soon" alert, `toggleTheme` is undefined |

### 5.2 Web App Pages

| Page | File | What Works | What's Placeholder/Stub |
|------|------|------------|------------------------|
| Home | `index.tsx` | Landing page renders | "Multi-Chain" feature card — only Ethereum/Sepolia supported |
| Register | `register.tsx` | WebAuthn registration, wallet generation, backend registration | PRF extension fallback stores secret in localStorage, public key is placeholder string (`'biometric-public-key-placeholder'`) |
| Login | `login.tsx` | WebAuthn authentication, wallet re-derivation | No backend token exchange |
| Dashboard | `dashboard.tsx` | Balance display, send form | No transaction history, no token support, no network selector |

### 5.3 Shared Packages

| Package | File | What's Implemented | What's Stub |
|---------|------|--------------------|-------------|
| `wallet-core` | `src/index.ts` | `generateWalletFromBiometric()` — deterministic scrypt → wallet, `getWalletBalance()`, `sendTransaction()`, `getTransactionHistory()` | `getTransactionHistory()` only scans 10 blocks (useless); No ERC-20 support; No multi-chain; No BIP-39 mnemonic |
| `biometric-core` | `src/index.ts` | `isWebAuthnSupported()`, `registerWebAuthnCredential()`, `authenticateWithWebAuthn()`, `generateKeyFromBiometric()` | `registerWebAuthnCredential()` creates options client-side (should be server-generated challenge); `authenticateWithWebAuthn()` same issue; **Not used by mobile app at all** |
| `utils` | `src/index.ts` | `extractEntropy()`, `formatAddress()`, `validateEmail()` | `extractEntropy()` falls back to localStorage secret; Only used by web |
| `shared-ui` | `src/index.tsx` | `Button`, `Card` | **Never imported by any consumer** |

### 5.4 API Endpoints

| Endpoint | Method | Implementation Status | Issues |
|----------|--------|----------------------|--------|
| `/health` | GET | ✅ Works | None |
| `/api/users` | POST | ⚠️ Partially works | Creates user, no Zod validation, duplicate of wallet/register |
| `/api/users/:id` | GET | ⚠️ Partially works | IDOR — no ownership check |
| `/api/users/:id` | PUT | ⚠️ Partially works | IDOR — can update any user |
| `/api/users` | GET | ⚠️ Partially works | Admin only, but admin auth is broken |
| `/api/wallet/register` | POST | ⚠️ Partially works | Never called by any frontend |
| `/api/wallet/balance/:address` | GET | ✅ Works | IDOR — any address accessible |
| `/api/wallet/transactions/:address` | GET | ⚠️ Partially works | IDOR, only DB records |
| `/api/transactions` | POST | ⚠️ Partially works | No ownership verification, userId from body |
| `/api/transactions/:id` | GET | ⚠️ Partially works | IDOR |
| `/api/transactions` | GET | ⚠️ Partially works | No pagination limits enforced |
| `/api/admin/stats` | GET | ⚠️ Partially works | Admin auth broken |
| `/api/admin/stats/daily` | GET | ⚠️ Partially works | N+1 query pattern (queries per day) |
| `/api/admin/stats/users` | GET | ⚠️ Partially works | Loads all users into memory |
| `/api/admin/stats/volume` | GET | ⚠️ Partially works | Loads all transactions into memory |

### 5.5 Biometric Flows

| Flow | Claimed Behavior | Actual Behavior |
|------|-----------------|-----------------|
| Mobile Registration | "Biometric scan → key derivation → wallet" | Biometric scan (yes/no gate) → `biometric-entropy-${deviceId}` + hardcoded salt → scrypt → wallet. **No biometric entropy in key** |
| Mobile Login | "Biometric scan → key regeneration → wallet recovery" | Same as registration — biometric is just a gate, wallet key is deterministic from deviceId |
| Mobile Transaction Signing | "Biometric scan → key regeneration → sign tx" | Same issue — biometric is just a gate |
| Web Registration | "WebAuthn → PRF extension → entropy → wallet" | WebAuthn works, but PRF extension may not be available. Falls back to random secret in localStorage. **Private key can be extracted from localStorage** |
| Web Login | "WebAuthn → re-derive key → wallet recovery" | WebAuthn re-authenticates, re-derives key from stored entropy. Works IF PRF works. Falls back to localStorage secret |
| Web Transaction | "WebAuthn → re-authenticate → sign tx" | Re-authenticates via WebAuthn, then uses stored entropy. Works but entropy may be in localStorage |

---

## 6. PRODUCTION READINESS CHECKLIST

### Docker Setup

| Item | Status | Details |
|------|--------|---------|
| Dockerfile for backend | ❌ MISSING | `docker-compose.yml` references `./backend/Dockerfile` which doesn't exist |
| Dockerfile for web | ❌ MISSING | No Dockerfile for Next.js app |
| Dockerfile for mobile | N/A | Mobile uses Expo EAS |
| docker-compose completeness | ⚠️ PARTIAL | Only postgres + backend, no web service |
| Environment variables in compose | ❌ INSECURE | Hardcoded `postgres:postgres` credentials |
| Volume mounts | ⚠️ PARTIAL | `./backend:/app` bind mount is dev-only, not production |
| Network isolation | ✅ OK | Custom bridge network defined |

### Environment Variable Handling

| Variable | Where Used | Default | Status |
|----------|-----------|---------|--------|
| `DATABASE_URL` | backend | None — required | ❌ No .env file exists |
| `PORT` | backend | 3001 | ✅ OK |
| `CORS_ORIGIN` | backend | `'*'` | ❌ Insecure default |
| `ADMIN_API_KEY` | backend | None — skips check if unset | ❌ CRITICAL |
| `ETHEREUM_RPC_URL` | backend | `https://rpc.ankr.com/eth_sepolia` | ⚠️ Public free tier RPC |
| `ETHEREUM_NETWORK` | backend | `sepolia` | ✅ OK for testnet |
| `NODE_ENV` | backend | Not set in compose (says `development`) | ⚠️ Leaks errors |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:3001/api` | ⚠️ Hardcoded localhost |
| `NEXT_PUBLIC_RPC_URL` | web | `https://rpc.ankr.com/eth_sepolia` | ⚠️ Public free tier RPC |
| `EXPO_PUBLIC_RPC_URL` | mobile | `https://rpc.ankr.com/eth_sepolia` | ⚠️ Public free tier RPC |

### Error Handling

| Layer | Status | Details |
|-------|--------|---------|
| Backend API routes | ⚠️ PARTIAL | Try/catch in controllers, but no Zod validation |
| Backend middleware | ❌ POOR | Auth errors are generic, no error codes |
| Backend database | ❌ POOR | No Prisma error handling (unique constraint, etc.) |
| Web frontend | ❌ POOR | `console.error` + generic `alert()`, no error boundary |
| Mobile frontend | ⚠️ PARTIAL | `Alert.alert()` for user-facing errors, but many catch blocks just `console.error` |
| Shared packages | ❌ POOR | Generic `throw new Error('Failed to ...')` with no error codes |

### Mobile App Expo Compatibility

| Item | Status | Details |
|------|--------|---------|
| Expo SDK version | ⚠️ OLD | SDK 48 (current is 52+), React 18.2.0 |
| `react-native-get-random-values` | ❌ MISSING | Required by `uuid` but not in dependencies |
| `react-native-qrcode-svg` | ❌ MISSING | Used in HomeScreen but not in dependencies |
| `react-native-biometrics` | ❌ UNUSED | Listed but never imported |
| Expo modules | ✅ OK | `expo-local-authentication`, `expo-secure-store`, `expo-linear-gradient` |
| EAS Build config | ❌ MISSING | No `eas.json` file |
| App config | ❌ MISSING | No `app.json` or `app.config.js` |

### Web App Next.js Build Issues

| Item | Status | Details |
|------|--------|---------|
| Next.js version | ⚠️ OLD | 15.1.7 (current is 15.2+) |
| Pages Router vs App Router | ⚠️ PAGES | Uses Pages Router (not App Router) |
| SSR localStorage | ❌ CRASH | `localStorage` used without `typeof window` checks |
| WebAuthn SSR | ❌ CRASH | `navigator.credentials` not available server-side |
| Build | ❌ UNTESTED | No `dist/` or `.next/` exists — build never run |
| `transpilePackages` | ✅ OK | Workspace packages listed |

### Backend Server Production Readiness

| Item | Status | Details |
|------|--------|---------|
| Missing Dockerfile | ❌ CRITICAL | Referenced in docker-compose but doesn't exist |
| No JWT verification | ❌ CRITICAL | jsonwebtoken imported but never used |
| No HTTPS | ❌ MISSING | No TLS configuration |
| No health dependencies | ⚠️ PARTIAL | Health check exists but no DB connectivity check |
| No request size limit | ❌ MISSING | No `express.json({ limit: '...' })` |
| Graceful shutdown | ✅ OK | SIGTERM handler exists |
| No clustering | ❌ MISSING | Single process only |
| No logging service | ❌ MISSING | Only `morgan('dev')` + `console.error` |

### Missing Dockerfile Issue

**File**: `docker-compose.yml`  
**Line**: 21-22

```yaml
build:
  context: ./backend
  dockerfile: Dockerfile
```

There is no `backend/Dockerfile` file. Running `docker-compose up` will fail with:

```
ERROR: failed to solve: failed to read dockerfile: open /backend/Dockerfile: no such file or directory
```

---

## Summary of All Issues

### CRITICAL (13)
1. Auth middleware doesn't verify JWTs — any 10+ char string passes
2. Biometric key derivation uses no real biometric entropy (deviceId-based)
3. Hardcoded static salt `biowallet-salt-v1` for all users
4. Admin auth bypassed when ADMIN_API_KEY not set
5. Mobile app never calls backend API
6. Duplicate user creation endpoints (`/api/users` and `/api/wallet/register`)
7. Missing Dockerfile for backend
8. No .env file — database URL not configured
9. `react-native-get-random-values` missing from mobile deps (runtime crash)
10. `react-native-qrcode-svg` missing from mobile deps (build failure)
11. `utils` package has no `ethers` dependency but imports it
12. No database migrations directory
13. Missing `app.json`/`eas.json` for Expo build

### HIGH (18)
14. CORS allows all origins by default
15. In-memory rate limiter — trivially bypassable, no trust proxy
16. No CSRF protection
17. Zod imported but never used for validation
18. Hardcoded database credentials in docker-compose
19. IDOR on all endpoints — no ownership checks
20. Transaction creation doesn't verify sender ownership
21. AdminStats fixed ID '1' conflicts with UUID schema
22. No database indexes
23. React version mismatch (19 vs 18.2)
24. `privateKey` material derivable from localStorage
25. No Helmet CSP configuration
26. `strictRateLimiter` not applied to most routes
27. Web `AuthContext.login()` type mismatch with mobile
28. Web `sendTransaction` signature differs from mobile
29. No request size limits
30. Admin routes load all data into memory
31. No JWT verification despite dependency being present

### MEDIUM (14)
32. localStorage used for sensitive data on web
33. `ProfileScreen` calls undefined `toggleTheme`
34. `ethers.scrypt()` may block main thread in browser
35. Float type for crypto amounts — precision loss
36. Missing database relations (fromAddress, toAddress, referredBy)
37. AdminStats model design issues
38. `@simplewebauthn/server` imported but unused in biometric-core
39. SSR safety issues with localStorage in Next.js
40. Referral code uses `Math.random()` not crypto
41. Transaction confirmation listener has no error handling
42. Web auth stores user ID as permanent token
43. `@simplewebauthn` version mismatch between packages
44. `shared-ui` package never imported
45. TypeScript target `es5` in web tsconfig

### LOW (7)
46. Error messages leak internal details in dev mode
47. `getTransactionHistory` scans only 10 blocks
48. `deviceId` not unique in schema
49. `react-native-biometrics` unused but listed
50. `@simplewebauthn/server` version inconsistency
51. No `dist/` directories — packages never built
52. No `.env.example` file for backend

---

## Recommended Priority Actions

### Immediate (Before Any Deployment)
1. **Implement real JWT verification** in `auth.ts` using the `jsonwebtoken` dependency already in `package.json`
2. **Fix biometric key derivation** to use actual biometric entropy (WebAuthn PRF output on web, or a proper key agreement protocol on mobile)
3. **Add Dockerfile** for backend
4. **Add missing dependencies** to mobile (`react-native-get-random-values`, `react-native-qrcode-svg`)
5. **Add ownership checks** to all API endpoints
6. **Add Zod validation** to all request bodies
7. **Change Float to Decimal** for crypto amounts in Prisma schema
8. **Add database indexes** for frequently queried fields
9. **Create Prisma migrations** instead of relying on `prisma db push`
10. **Set proper CORS origin** — never use `*`

### Short Term (Before Production)
11. Implement proper biometric entropy extraction (not deviceId-based)
12. Add CSRF protection
13. Use Redis-backed rate limiting
14. Add `.env.example` with all required variables
15. Remove duplicate user creation endpoint
16. Add transaction timeout monitoring
17. Fix React version mismatch for mobile
18. Add error boundaries to web app
19. Create `app.json` / `eas.json` for mobile
20. Add HTTPS/TLS termination

### Medium Term (Production Hardening)
21. Implement real transaction history (use Etherscan API or indexer)
22. Add ERC-20 token support
23. Implement wallet backup/recovery mechanism
24. Add proper admin dashboard
15. Add monitoring and structured logging
26. Implement database connection pooling
27. Add API versioning
28. Implement WebSocket for real-time balance updates
