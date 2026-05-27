import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============================================================
// AUTH GUARD — Route protection helpers for API routes
// ============================================================

interface AuthSession {
  userId: string;
  email: string;
  name?: string | null;
  plan?: string;
  role?: string;
  automationMode?: string;
  stripeCustomerId?: string | null;
}

/**
 * requireAuth — Extracts and validates the session from the request.
 * Returns the authenticated user's session data or throws a 401 response.
 *
 * @param request - The incoming NextRequest
 * @returns AuthSession with user details
 * @throws NextResponse with 401 if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.user.id) {
    throw NextResponse.json(
      { error: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    plan: session.user.plan,
    role: session.user.role,
    automationMode: session.user.automationMode,
    stripeCustomerId: session.user.stripeCustomerId,
  };
}

/**
 * requireWorkspaceAccess — Verifies that the authenticated user owns or is a member of the specified workspace.
 * Returns the workspace data if access is granted, otherwise throws 403.
 *
 * @param request - The incoming NextRequest
 * @param workspaceId - The workspace ID to check access for
 * @returns The workspace object from the database and auth session
 * @throws NextResponse with 401 if not authenticated, 403 if no access, 404 if not found
 */
export async function requireWorkspaceAccess(
  request: NextRequest,
  workspaceId: string
) {
  // First, ensure the user is authenticated
  const auth = await requireAuth(request);

  // Look up the workspace
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw NextResponse.json(
      { error: "Workspace not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Check if the user is the owner
  if (workspace.ownerId === auth.userId) {
    return { auth, workspace };
  }

  // Check if the user is a workspace member
  const membership = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: auth.userId } },
  });

  if (!membership) {
    throw NextResponse.json(
      { error: "You do not have access to this workspace", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  return { auth, workspace, membership };
}

/**
 * requireRole — Verifies that the authenticated user has the required role.
 * Role hierarchy: admin > operator > viewer
 *
 * @param request - The incoming NextRequest
 * @param requiredRole - The minimum role required ("admin", "operator", "viewer")
 * @returns AuthSession with user details
 * @throws NextResponse with 401 if not authenticated, 403 if insufficient role
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: "admin" | "operator" | "viewer"
): Promise<AuthSession> {
  const auth = await requireAuth(request);

  const roleHierarchy: Record<string, number> = {
    admin: 3,
    operator: 2,
    viewer: 1,
  };

  const userLevel = roleHierarchy[auth.role ?? "viewer"] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  if (userLevel < requiredLevel) {
    throw NextResponse.json(
      {
        error: `Insufficient permissions. Required role: ${requiredRole}, your role: ${auth.role ?? "viewer"}`,
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * requirePlan — Verifies that the authenticated user has the required plan level.
 * Plan hierarchy: agency > pro > creator > free
 *
 * @param request - The incoming NextRequest
 * @param requiredPlan - The minimum plan required ("agency", "pro", "creator", "free")
 * @returns AuthSession with user details
 * @throws NextResponse with 401 if not authenticated, 403 if insufficient plan
 */
export async function requirePlan(
  request: NextRequest,
  requiredPlan: "agency" | "pro" | "creator" | "free"
): Promise<AuthSession> {
  const auth = await requireAuth(request);

  const planHierarchy: Record<string, number> = {
    agency: 4,
    pro: 3,
    creator: 2,
    free: 1,
  };

  const userLevel = planHierarchy[auth.plan ?? "free"] ?? 0;
  const requiredLevel = planHierarchy[requiredPlan] ?? 0;

  if (userLevel < requiredLevel) {
    throw NextResponse.json(
      {
        error: `Insufficient plan. Required plan: ${requiredPlan}, your plan: ${auth.plan ?? "free"}`,
        code: "PLAN_REQUIRED",
      },
      { status: 403 }
    );
  }

  return auth;
}
