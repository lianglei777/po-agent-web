import type {
  AgentCommand,
  ModelInfo,
  RuntimeState,
  SessionDetail,
  ThinkingLevel,
} from "./agent-types";

type ApiError = { error?: { code?: string; message?: string } };

/** 携带后端错误码的请求异常，便于前端按 code 分支处理 */
export class ApiRequestError extends Error {
  readonly code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T & ApiError;
  if (!response.ok) {
    throw new ApiRequestError(
      data.error?.message ?? `Request failed (${response.status})`,
      data.error?.code,
    );
  }
  return data;
}

export function loadSession(id: string) {
  return requestJson<SessionDetail>(
    `/api/sessions/${encodeURIComponent(id)}?includeState=true`,
  );
}

export function loadSessionContext(id: string, leafId: string) {
  const query = new URLSearchParams({ leafId });
  return requestJson<{ context: SessionDetail["context"] }>(
    `/api/sessions/${encodeURIComponent(id)}/context?${query}`,
  );
}

export function loadModels() {
  return requestJson<{
    models: ModelInfo[];
    defaultModel: { provider: string; modelId: string } | null;
  }>("/api/models");
}

export function createAgent(input: {
  cwd: string;
  provider?: string;
  modelId?: string;
  thinkingLevel?: ThinkingLevel;
  toolNames?: string[];
}) {
  return requestJson<{ sessionId: string }>("/api/agent/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function sendCommand<T = { success: true }>(
  id: string,
  command: AgentCommand,
) {
  return requestJson<T>(`/api/agent/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
}

export function loadRuntime(id: string) {
  return requestJson<{ running: boolean; state?: RuntimeState }>(
    `/api/agent/${encodeURIComponent(id)}`,
  );
}
