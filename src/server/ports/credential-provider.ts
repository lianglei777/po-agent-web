import type {
  ApiKeyProviderInfo,
  ApiKeyStatus,
  ConfiguredApiKeyProviderInfo,
  OAuthCallbacks,
  OAuthProviderInfo,
} from "@/server/domain/auth";

export interface CredentialProvider {
  listOAuthProviders(): Promise<OAuthProviderInfo[]>;
  listApiKeyProviders(): Promise<ApiKeyProviderInfo[]>;
  listConfiguredApiKeyProviders(): Promise<ConfiguredApiKeyProviderInfo[]>;
  getApiKeyStatus(provider: string): Promise<ApiKeyStatus>;
  setApiKey(provider: string, apiKey: string): Promise<void>;
  removeApiKey(provider: string): Promise<void>;
  startOAuth(
    provider: string,
    callbacks: OAuthCallbacks,
    signal: AbortSignal,
  ): Promise<void>;
  logout(provider: string): Promise<void>;
}

