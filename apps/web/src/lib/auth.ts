import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { StaffRole } from "@poplab/api";

export interface StaffContext {
  userId: string;
  email: string | null;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: StaffRole;
}

/**
 * Resolves the signed-in operator and their tenant, or redirects to /login.
 *
 * The console is single-tenant per session: a staff member belongs to exactly
 * one tenant here (the platform's own multi-tenant admin is a separate surface).
 * Every console page calls this, so tenant scoping is established once, from the
 * session, and never trusted from a URL or a form field.
 */
export async function requireStaff(): Promise<StaffContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("role, tenant_id, tenants(name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!staff || !staff.tenants) {
    // Signed in but not staff of any tenant — nothing to show them.
    redirect("/login?e=no-tenant");
  }

  const tenant = staff.tenants as unknown as { name: string; slug: string };
  return {
    userId: user.id,
    email: user.email ?? null,
    tenantId: staff.tenant_id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    role: staff.role,
  };
}
