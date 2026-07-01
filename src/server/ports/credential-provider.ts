import type {
  ApiKeyProviderInfo,
  ApiKeyStatus,
  StoredApiKeyProviderInfo,
  OAuthCallbacks,
  OAuthProviderInfo,
} from "@/server/domain/auth";

/**
 * 凭证提供者端口。
 *
 * 抽象 OAuth 与 API Key 两类凭证的查询、写入、删除和 OAuth 流程管理。
 * 具体实现由 infrastructure 层提供，凭证存储细节不暴露到此接口。
 */
export interface CredentialProvider {
  /** 列出支持 OAuth 登录的凭证提供者。 */
  listOAuthProviders(): Promise<OAuthProviderInfo[]>;
  /** 列出支持 API Key 认证的凭证提供者。 */
  listApiKeyProviders(): Promise<ApiKeyProviderInfo[]>;
  /** 列出已配置 API Key 的凭证提供者。 */
  listConfiguredApiKeyProviders(): Promise<StoredApiKeyProviderInfo[]>;
  /** 查询指定提供者的 API Key 状态。 */
  getApiKeyStatus(provider: string): Promise<ApiKeyStatus>;
  /** 设置指定提供者的 API Key。 */
  setApiKey(provider: string, apiKey: string): Promise<void>;
  /** 移除指定提供者的 API Key。 */
  removeApiKey(provider: string): Promise<void>;
  /**
   * 启动指定提供者的 OAuth 登录流程。
   *
   * 通过 callbacks 接收 OAuth 各阶段回调，支持通过 signal 取消流程。
   */
  startOAuth(
    provider: string,
    callbacks: OAuthCallbacks,
    signal: AbortSignal,
  ): Promise<void>;
  /** 登出指定提供者，清除其凭证。 */
  logout(provider: string): Promise<void>;
}
