export interface ProcessRunner {
  run(
    executable: string,
    args: string[],
    options?: {
      cwd?: string;
      timeoutMs?: number;
      maxOutputBytes?: number;
      env?: Record<string, string | undefined>;
    },
  ): Promise<{
    stdout: string;
    stderr: string;
  }>;
}
