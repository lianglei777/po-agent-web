import type {
  ApiKeyProviderInfo as ApiKeyProviderContract,
  OAuthProviderInfo,
} from "@/contracts/auth";
import {
  MODEL_API_PROTOCOLS,
  type ModelApiProtocol,
} from "@/contracts/model-compat";
import type {
  ModelDiagnostic,
  ModelTestResponse,
} from "@/contracts/models";

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
export type OAuthProvider = OAuthProviderInfo;
export type ApiKeyProviderInfo = ApiKeyProviderContract;

export interface ApiKeyProvider extends ApiKeyProviderInfo {
  configured: boolean;
  source?: string;
  label?: string;
  modelCount: number;
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

export interface ModelDiscoverySuggestion {
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

export type { OAuthServerEvent } from "@/contracts/auth";
export type {
  ModelDiagnostic,
  ModelDiagnosticPatch,
} from "@/contracts/models";
export type ModelTestResult = ModelTestResponse;
