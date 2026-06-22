import type {
  DiscoverModelsInput,
  DiscoverModelsResult,
  ModelInfo,
  TestModelInput,
  TestModelResult,
} from "@/server/domain/model";

/**
 * 模型提供者端口。
 *
 * 抽象可用模型列表查询、默认模型获取、配置读写、模型发现和配置测试能力。
 * 具体实现由 infrastructure 层提供，供应商差异在此层转换为统一的 domain 类型。
 */
export interface ModelProvider {
  /** 列出所有可用模型。 */
  listAvailable(): Promise<ModelInfo[]>;
  /** 获取默认模型提供者和模型标识；未配置时返回 `null`。 */
  getDefault(): Promise<{
    provider: string;
    modelId: string;
  } | null>;
  /** 读取当前模型配置。 */
  readConfig(): Promise<Record<string, unknown>>;
  /** 写入模型配置。 */
  writeConfig(config: Record<string, unknown>): Promise<void>;
  /** 根据输入参数发现可用模型列表。 */
  discoverModels(input: DiscoverModelsInput): Promise<DiscoverModelsResult>;
  /**
   * 测试模型配置是否可用。
   *
   * 此操作有副作用（会发起真实模型调用），用于验证配置正确性。
   */
  testConfig(input: TestModelInput): Promise<TestModelResult>;
}
