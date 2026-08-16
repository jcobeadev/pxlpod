"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

export interface RedeemState {
  ok?: boolean;
  message?: string;
  code?: string;
  renderPath?: string;
}

/**
 * Redeem a print pass at the booth. Calls the SECURITY DEFINER redeem RPC, which
 * verifies the caller is staff of the tenant and flips the pass in one
 * transaction — two people scanning the same code cannot both win.
 */
export async function redeemPass(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const staff = await requireStaff();
  const supabase = await createClient();
  const code = ((formData.get("code") as string) || "").trim().toUpperCase();
  const cashPesos = Number(formData.get("cash") ?? 0);
  if (!code) return { ok: false, message: "Enter a code." };

  const { data, error } = await supabase.rpc("redeem_print_job", {
    p_tenant_id: staff.tenantId,
    p_code: code,
    p_cash_cents: Math.round((Number.isFinite(cashPesos) ? cashPesos : 0) * 100),
  });
  if (error) return { ok: false, message: error.message, code };

  revalidatePath("/print");
  return {
    ok: true,
    message: `Pass ${code} redeemed — open the strip and print it.`,
    code,
    renderPath: (data as { render_path?: string } | null)?.render_path,
  };
}
