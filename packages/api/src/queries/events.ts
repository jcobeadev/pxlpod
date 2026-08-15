import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PoplabClient } from "../client.ts";
import type { EventRow, LiveEventRow } from "../types.ts";

export type EventsWindow = "upcoming" | "past";

export interface UseEventsOptions {
  when: EventsWindow;
}

export function eventsQueryKey(tenantId: string, when: EventsWindow) {
  return ["events", tenantId, when] as const;
}

export function liveEventQueryKey(tenantId: string) {
  return ["liveEvent", tenantId] as const;
}

/**
 * A tenant's events, split on whether they have ended yet. "Upcoming" is
 * everything that has not reached `ends_at` — including a pop-up running
 * right now — ordered soonest-first. "Past" is everything that has,
 * newest-first.
 */
export async function fetchEvents(
  client: PoplabClient,
  tenantId: string,
  when: EventsWindow,
): Promise<EventRow[]> {
  const nowIso = new Date().toISOString();
  const base = client.from("events").select("*").eq("tenant_id", tenantId);

  const { data, error } =
    when === "upcoming"
      ? await base.gte("ends_at", nowIso).order("starts_at", { ascending: true })
      : await base.lt("ends_at", nowIso).order("starts_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}

export function useEvents(
  client: PoplabClient,
  tenantId: string,
  options: UseEventsOptions,
): UseQueryResult<EventRow[]> {
  return useQuery({
    queryKey: eventsQueryKey(tenantId, options.when),
    queryFn: () => fetchEvents(client, tenantId, options.when),
    enabled: Boolean(tenantId),
  });
}

/**
 * The pop-up running right now, if any — a straight passthrough of the
 * `live_events(uuid)` Postgres function, which is the single source of truth
 * for "is an event live, and is it still inside its print grace window".
 * This result gates whether printing is offered at all in the capture flow,
 * so it deliberately adds no extra filtering of its own that could drift
 * from the function's definition. `null` when nothing is live.
 */
export async function fetchLiveEvent(
  client: PoplabClient,
  tenantId: string,
): Promise<LiveEventRow | null> {
  const { data, error } = await client.rpc("live_events", {
    target_tenant: tenantId,
  });
  if (error) {
    throw error;
  }
  return data?.[0] ?? null;
}

export function useLiveEvent(
  client: PoplabClient,
  tenantId: string,
): UseQueryResult<LiveEventRow | null> {
  return useQuery({
    queryKey: liveEventQueryKey(tenantId),
    queryFn: () => fetchLiveEvent(client, tenantId),
    enabled: Boolean(tenantId),
    // Printing must stop the moment the grace window closes, so this is one
    // of the few reads here worth polling rather than waiting on a refetch.
    refetchInterval: 60_000,
  });
}
