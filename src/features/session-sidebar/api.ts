import type {
  Project,
  ProjectBrowseResult,
  SessionInfo,
} from "./types";

type ApiError = { error?: { message?: string } };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Request failed (${response.status})`);
  }
  return data;
}

export function loadSessions() {
  return requestJson<SessionInfo[]>("/api/sessions");
}

export function loadHome() {
  return requestJson<{ home: string }>("/api/home");
}

export function loadProjects() {
  return requestJson<Project[]>("/api/projects");
}

export function addProject(path: string) {
  return requestJson<Project>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
}

export function removeProject(path: string) {
  return requestJson<{ success: true }>(
    `/api/projects?path=${encodeURIComponent(path)}`,
    { method: "DELETE" },
  );
}

export function browseProjects(path?: string) {
  const query = path ? `?path=${encodeURIComponent(path)}` : "";
  return requestJson<ProjectBrowseResult>(`/api/projects/browse${query}`);
}

export function renameSession(id: string, name: string) {
  return requestJson<{ success: true }>(
    `/api/sessions/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    },
  );
}

export function deleteSession(id: string) {
  return requestJson<{ success: true }>(
    `/api/sessions/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
