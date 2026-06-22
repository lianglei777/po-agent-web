import type {
  BinaryFile,
  FileChangeEvent,
  FileEntry,
} from "@/server/domain/workspace";

/**
 * 工作区文件服务端口。
 *
 * 抽象对已注册工作区根目录下的文件列表、读取、二进制获取和变更监听能力。
 * 所有路径必须经过 workspace root 校验，实现由 infrastructure 层提供。
 */
export interface WorkspaceFileService {
  /** 列出指定路径下的文件与目录条目。 */
  list(path: string): Promise<FileEntry[]>;
  /** 以文本形式读取文件，返回内容、语言和大小信息。 */
  readText(path: string): Promise<{
    content: string;
    language: string;
    size: number;
  }>;
  /** 读取二进制文件内容。 */
  getBinary(path: string): Promise<BinaryFile>;
  /**
   * 监听指定路径的文件变更事件。
   *
   * 返回的取消函数用于停止监听并释放底层资源。
   */
  watch(
    path: string,
    listener: (event: FileChangeEvent) => void,
  ): Promise<() => void>;
}

/**
 * 工作区根目录提供者端口。
 *
 * 管理已注册的工作区根目录列表，文件访问必须限定在这些根目录范围内。
 */
export interface WorkspaceRootProvider {
  /** 列出所有已注册的工作区根目录路径。 */
  listRoots(): Promise<string[]>;
  /** 添加一个新的工作区根目录。 */
  addRoot(path: string): void;
}
