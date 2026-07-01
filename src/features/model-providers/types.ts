import {
  MODEL_API_PROTOCOLS,
  type ModelApiProtocol,
} from "@/contracts/model-compat";

export const API_OPTIONS = MODEL_API_PROTOCOLS;

export const THINKING_LEVELS = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;

export type ApiOption = ModelApiProtocol;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export type ConfiguredThinkingLevel = Exclude<ThinkingLevel, "off">;

export interface OAuthProvider {
  id: string;
  name: string;
}

export interface ApiKeyProviderInfo {
  id: string;
  name: string;
}

export interface ApiKeyProvider extends ApiKeyProviderInfo {
  configured: boolean;
  source?: string;
  label?: string;
  modelCount: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

export interface ModelEntry {
  id: string;
  name?: string;
  api?: string;
  reasoning?: boolean;
  thinkingDefaultLevel?: ConfiguredThinkingLevel;
  thinkingLevelMap?: Record<string, string | null>;
  input?: string[];
  contextWindow?: number;
  maxTokens?: number;
  cost?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  compat?: Record<string, unknown>;
  provenance?: {
    source?: ModelDiscoverySource;
    confidence?: ModelDiscoveryConfidence;
  };
}

export interface ProviderEntry {
  baseUrl?: string;
  api?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  compat?: Record<string, unknown>;
  models?: ModelEntry[];
  modelOverrides?: Record<string, unknown>;
}

export interface ModelsJson {
  providers?: Record<string, ProviderEntry>;
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
  model: ModelEntry;
}

export interface ModelDiscoveryResult {
  models: ModelDiscoverySuggestion[];
  remoteError?: string;
}

export type OAuthLoginState =
  | { phase: "idle" }
  | { phase: "connecting" }
  | { phase: "auth"; url: string; instructions?: string }
  | {
      phase: "device_code";
      userCode: string;
      verificationUri: string;
      intervalSeconds?: number;
      expiresInSeconds?: number;
    }
  | {
      phase: "prompt";
      message: string;
      placeholder?: string;
      allowEmpty?: boolean;
      token: string;
    }
  | {
      phase: "select";
      message: string;
      options: Array<{ id: string; label: string }>;
      token: string;
    }
  | { phase: "progress"; message: string }
  | { phase: "success" }
  | { phase: "error"; message: string };

export type ModelTestState =
  | { phase: "idle" }
  | { phase: "testing" }
  | { phase: "stale" }
  | {
      phase: "success";
      latencyMs?: number;
      responseText?: string;
      checkedAt?: string;
    }
  | {
      phase: "error";
      message: string;
      latencyMs?: number;
      diagnostic?: ModelDiagnostic;
      checkedAt?: string;
    };

export type Selection =
  | { type: "provider"; name: string }
  | { type: "model"; providerName: string; index: number }
  | { type: "oauth"; providerId: string }
  | { type: "apikey"; providerId: string };

export type OAuthServerEvent =
  | { type: "auth"; url: string; instructions?: string }
  | {
      type: "device_code";
      userCode: string;
      verificationUri: string;
      intervalSeconds?: number;
      expiresInSeconds?: number;
    }
  | {
      type: "prompt";
      token: string;
      message: string;
      placeholder?: string;
      allowEmpty?: boolean;
    }
  | {
      type: "select";
      token: string;
      message: string;
      options: Array<{ id: string; label: string }>;
    }
  | { type: "progress"; message: string }
  | { type: "error"; message: string }
  | { type: "complete" };

export interface ModelTestResult {
  ok: boolean;
  latencyMs?: number;
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

export interface ModelDiagnosticPatch {
  scope: "provider" | "model";
  api: string;
  changes: Record<string, unknown>;
  reason: string;
}

export interface ModelDiagnostic {
  code: string;
  summary: string;
  technicalMessage?: string;
  provider?: string;
  model?: string;
  retryable: boolean;
  suggestedPatch?: ModelDiagnosticPatch;
}
