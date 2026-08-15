import { useQuery, type UseQueryResult } from "@tanstack/react-query";
// By package name, via template-spec's exports map. A relative path across the
// package boundary would resolve for Node's TS loader but hardcodes the repo's
// on-disk layout, which is exactly what Metro and Next resolve by name instead.
import { TemplateSchema, type Template } from "@poplab/template-spec/schema";
import type { PoplabClient } from "../client.ts";
import type { TemplateRow } from "../types.ts";

/** A template row whose `spec` column has been parsed into a validated `Template`. */
export type ValidatedTemplateRow = Omit<TemplateRow, "spec"> & { spec: Template };

export function templatesQueryKey(tenantId: string) {
  return ["templates", tenantId] as const;
}

export function templateQueryKey(templateId: string) {
  return ["template", templateId] as const;
}

interface ZodLikeIssue {
  path: PropertyKey[];
  message: string;
}

function formatIssues(issues: ZodLikeIssue[]): string {
  return issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

/**
 * Published templates for a tenant. Every row's `spec` is parsed against
 * `TemplateSchema` before it reaches a caller; a row that fails validation is
 * dropped rather than thrown, because one malformed template must not crash
 * the capture flow for every other template in the library. The drop is
 * logged so it gets noticed and fixed upstream.
 */
export async function fetchTemplates(
  client: PoplabClient,
  tenantId: string,
): Promise<ValidatedTemplateRow[]> {
  const { data, error } = await client
    .from("templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) {
    throw error;
  }

  const templates: ValidatedTemplateRow[] = [];
  for (const row of data ?? []) {
    const parsed = TemplateSchema.safeParse(row.spec);
    if (!parsed.success) {
      console.warn(
        `[@poplab/api] dropping template "${row.name}" (${row.id}): invalid spec — ${formatIssues(parsed.error.issues)}`,
      );
      continue;
    }
    templates.push({ ...row, spec: parsed.data });
  }
  return templates;
}

export function useTemplates(
  client: PoplabClient,
  tenantId: string,
): UseQueryResult<ValidatedTemplateRow[]> {
  return useQuery({
    queryKey: templatesQueryKey(tenantId),
    queryFn: () => fetchTemplates(client, tenantId),
    enabled: Boolean(tenantId),
  });
}

/**
 * A single template by id. Unlike `fetchTemplates`, an invalid spec here is
 * thrown rather than silently dropped — the caller asked for this exact
 * template, so returning nothing would hide the failure instead of surfacing it.
 */
export async function fetchTemplate(
  client: PoplabClient,
  templateId: string,
): Promise<ValidatedTemplateRow | null> {
  const { data, error } = await client
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const parsed = TemplateSchema.safeParse(data.spec);
  if (!parsed.success) {
    throw new Error(
      `Template "${data.name}" (${data.id}) has an invalid spec: ${formatIssues(parsed.error.issues)}`,
    );
  }
  return { ...data, spec: parsed.data };
}

export function useTemplate(
  client: PoplabClient,
  templateId: string,
): UseQueryResult<ValidatedTemplateRow | null> {
  return useQuery({
    queryKey: templateQueryKey(templateId),
    queryFn: () => fetchTemplate(client, templateId),
    enabled: Boolean(templateId),
  });
}
