import type {
  InstallSkillResult,
  SkillLoadResult,
  SkillSearchResult,
} from "./types";

export async function loadSkills(
  cwd: string,
  signal?: AbortSignal,
): Promise<SkillLoadResult> {
  return requestJson(
    `/api/skills?cwd=${encodeURIComponent(cwd)}`,
    { signal },
  );
}

export async function setSkillModelInvocation(
  input: {
    cwd: string;
    skillId: string;
    disabled: boolean;
    expectedVersion: string;
  },
  signal?: AbortSignal,
): Promise<SkillLoadResult> {
  return requestJson("/api/skills", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}

export async function searchSkills(
  query: string,
  signal?: AbortSignal,
): Promise<SkillSearchResult[]> {
  const response = await requestJson<{ results: SkillSearchResult[] }>(
    "/api/skills/search",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 30 }),
      signal,
    },
  );
  return response.results;
}

export async function installSkill(
  input: {
    package: string;
    scope: "global" | "project";
    cwd: string;
  },
  signal?: AbortSignal,
): Promise<InstallSkillResult> {
  return requestJson("/api/skills/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}

export async function removeSkill(
  input: { skillId: string; cwd: string },
  signal?: AbortSignal,
): Promise<SkillLoadResult> {
  return requestJson("/api/skills", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? `Request failed with ${response.status}`,
    );
  }
  return payload as T;
}
