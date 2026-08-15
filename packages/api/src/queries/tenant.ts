import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PoplabClient } from "../client.ts";
import type { TenantRow } from "../types.ts";

export function tenantQueryKey(tenantId: string) {
  return ["tenant", tenantId] as const;
}

/**
 * A tenant's public brand tokens (colours, logo paths, etc. under `brand`).
 * `null` covers both "no such tenant" and "tenant is inactive" — RLS hides
 * inactive tenants from anon/authenticated reads entirely, so the two cases
 * are indistinguishable from here, which is the point.
 */
export async function fetchTenant(
  client: PoplabClient,
  tenantId: string,
): Promise<TenantRow | null> {
  const { data, error } = await client
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export function useTenant(
  client: PoplabClient,
  tenantId: string,
): UseQueryResult<TenantRow | null> {
  return useQuery({
    queryKey: tenantQueryKey(tenantId),
    queryFn: () => fetchTenant(client, tenantId),
    enabled: Boolean(tenantId),
  });
}
