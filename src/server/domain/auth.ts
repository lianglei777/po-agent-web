import type {
  ApiKeyProviderInfo,
  OAuthServerEvent,
} from "@/contracts/auth";

export type {
  ApiKeyProviderInfo,
  ApiKeyStatus,
  OAuthProviderInfo,
  OAuthServerEvent,
} from "@/contracts/auth";

export interface StoredApiKeyProviderInfo extends ApiKeyProviderInfo {
  configured: true;
  source?: string;
  label?: string;
}

export interface OAuthCallbacks {
  emit(event: OAuthServerEvent): void;
  requestInput(input: {
    provider: string;
    message: string;
    placeholder?: string;
    allowEmpty?: boolean;
    options?: Array<{ id: string; label: string }>;
  }): Promise<string>;
}
