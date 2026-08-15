import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PoplabClient } from "../client.ts";
import type { Json } from "../types.ts";

/** All of a tenant's editable copy, folded from rows into a key -> value map. */
export type AppContentMap = Record<string, Json>;

export function appContentQueryKey(tenantId: string) {
  return ["appContent", tenantId] as const;
}

export async function fetchAppContent(
  client: PoplabClient,
  tenantId: string,
): Promise<AppContentMap> {
  const { data, error } = await client
    .from("app_content")
    .select("key, value")
    .eq("tenant_id", tenantId);
  if (error) {
    throw error;
  }

  const content: AppContentMap = {};
  for (const row of data ?? []) {
    content[row.key] = row.value;
  }
  return content;
}

export function useAppContent(
  client: PoplabClient,
  tenantId: string,
): UseQueryResult<AppContentMap> {
  return useQuery({
    queryKey: appContentQueryKey(tenantId),
    queryFn: () => fetchAppContent(client, tenantId),
    enabled: Boolean(tenantId),
  });
}
