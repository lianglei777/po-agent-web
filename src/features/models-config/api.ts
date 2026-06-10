import type {
  ApiKeyProvider,
  ApiKeyProviderInfo,
  ModelInfo,
  ModelsJson,
  ModelTestResult,
  OAuthProvider,
} from "./types";

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
}

interface AllProvidersResponse {
  oauth: OAuthProvider[];
  apiKey: ApiKeyProviderInfo[];
}

interface ModelsResponse {
  models: ModelInfo[];
}

interface ApiKeyStatus {
  configured: boolean;
  source?: string;
  label?: string;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T & ApiErrorResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Request failed (${response.status})`);
  }
  return data;
}

export function normalizeModelsConfig(value: unknown): ModelsJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { providers: {} };
  }
  const config = value as ModelsJson;
  return {
    ...config,
    providers:
      config.providers &&
      typeof config.providers === "object" &&
      !Array.isArray(config.providers)
        ? config.providers
        : {},
  };
}

export function countModelsByProvider(models: ModelInfo[]) {
  return models.reduce<Record<string, number>>((counts, model) => {
    counts[model.provider] = (counts[model.provider] ?? 0) + 1;
    return counts;
  }, {});
}

export async function loadApiKeyProvider(
  provider: ApiKeyProviderInfo,
  modelCount = 0,
): Promise<ApiKeyProvider> {
  try {
    const status = await requestJson<ApiKeyStatus>(
      `/api/auth/api-key/${encodeURIComponent(provider.id)}`,
    );
    return { ...provider, ...status, modelCount };
  } catch {
    return { ...provider, configured: false, modelCount };
  }
}

export async function loadModelsConfigData() {
  const [rawConfig, providers, models] = await Promise.all([
    requestJson<unknown>("/api/models-config"),
    requestJson<AllProvidersResponse>("/api/auth/all-providers"),
    requestJson<ModelsResponse>("/api/models"),
  ]);
  const counts = countModelsByProvider(models.models);
  const apiKeyProviders = await Promise.all(
    providers.apiKey.map((provider) =>
      loadApiKeyProvider(provider, counts[provider.id] ?? 0),
    ),
  );
  return {
    config: normalizeModelsConfig(rawConfig),
    oauthProviders: providers.oauth,
    apiKeyProviders,
  };
}

export function saveModelsConfig(config: ModelsJson) {
  return requestJson<{ success: true }>("/api/models-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export function testModelConfig(input: {
  provider: string;
  modelId: string;
  config: ModelsJson;
  timeoutMs?: number;
}) {
  return requestJson<ModelTestResult>("/api/models-config/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function saveApiKey(providerId: string, apiKey: string) {
  return requestJson<{ success: true }>(
    `/api/auth/api-key/${encodeURIComponent(providerId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    },
  );
}

export function removeApiKey(providerId: string) {
  return requestJson<{ success: true }>(
    `/api/auth/api-key/${encodeURIComponent(providerId)}`,
    { method: "DELETE" },
  );
}

export function submitOAuthInput(
  providerId: string,
  token: string,
  value: string,
) {
  return requestJson<{ success: true }>(
    `/api/auth/login/${encodeURIComponent(providerId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, value }),
    },
  );
}

export function logoutOAuth(providerId: string) {
  return requestJson<{ success: true }>(
    `/api/auth/logout/${encodeURIComponent(providerId)}`,
    { method: "POST" },
  );
}
