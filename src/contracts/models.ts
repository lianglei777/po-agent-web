import type { ThinkingLevel } from "./agent";
import type {
  ConfiguredApiKeyProviderInfo,
  OAuthProviderInfo,
} from "./auth";
import type { SuccessResponse } from "./common";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxTokens?: number;
  input?: Array<"text" | "image">;
  thinkingLevels: ThinkingLevel[];
  thinkingDefaultLevel?: Exclude<ThinkingLevel, "auto" | "off">;
  thinkingLevelMap?: Record<string, string | null>;
}

export interface ModelTestRequest {
  provider: string;
  modelId: string;
  config?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface ModelDiscoveryRequest {
  providerName: string;
  provider: {
    api?: string;
    baseUrl?: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
}

export type ModelDiscoverySource =
  | "catalog"
  | "remote"
  | "inferred"
  | "defaulted";

export type ModelDiscoveryConfidence = "high" | "medium" | "low";

export interface ModelDiscoverySuggestion {
  source: ModelDiscoverySource;
  confidence: ModelDiscoveryConfidence;
  verification: "unverified";
  model: {
    id: string;
    name?: string;
    api?: string;
    reasoning?: boolean;
    thinkingLevelMap?: Record<string, string | null>;
    input?: Array<"text" | "image">;
    contextWindow?: number;
    maxTokens?: number;
    cost?: {
      input?: number;
      output?: number;
      cacheRead?: number;
      cacheWrite?: number;
    };
    compat?: Record<string, unknown>;
  };
}

export interface ModelDiscoveryResponse {
  models: ModelDiscoverySuggestion[];
  remoteError?: string;
}

export type ModelDiagnosticCode =
  | "MODEL_AUTH_FAILED"
  | "MODEL_NOT_FOUND"
  | "MODEL_RATE_LIMITED"
  | "MODEL_TIMEOUT"
  | "MODEL_UNAVAILABLE"
  | "MODEL_PROTOCOL_ERROR"
  | "MODEL_RESPONSE_INVALID"
  | "MODEL_REQUEST_FAILED"
  | "UNKNOWN_MODEL_ERROR";

export interface ModelDiagnosticPatch {
  scope: "provider" | "model";
  api: string;
  changes: Record<string, unknown>;
  reason: string;
}

export interface ModelDiagnostic {
  code: ModelDiagnosticCode;
  summary: string;
  technicalMessage?: string;
  provider?: string;
  model?: string;
  retryable: boolean;
  suggestedPatch?: ModelDiagnosticPatch;
}

export interface ModelTestResponse {
  ok: boolean;
  latencyMs?: number;
  status?: number;
  responseText?: string;
  error?: string;
  verification: {
    status: "verified" | "failed";
    scenario: "basic-chat";
    checkedAt: string;
    latencyMs: number;
  };
  diagnostic?: ModelDiagnostic;
}

export interface ModelsResponse {
  models: ModelInfo[];
  defaultModel: { provider: string; modelId: string } | null;
}

export type ModelsConfigResponse = Record<string, unknown>;
export type SaveModelsConfigRequest = Record<string, unknown>;
export type SaveModelsConfigResponse = SuccessResponse;

export interface ModelsConfigBootstrapResponse {
  config: unknown;
  oauthProviders: OAuthProviderInfo[];
  apiKeyProviders: ConfiguredApiKeyProviderInfo[];
}
