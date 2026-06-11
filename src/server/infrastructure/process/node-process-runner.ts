import { spawn } from "node:child_process";
import type { ProcessRunner } from "@/server/ports/process-runner";

export class NodeProcessRunner implements ProcessRunner {
  run(
    executable: string,
    args: string[],
    options?: {
      cwd?: string;
      timeoutMs?: number;
      maxOutputBytes?: number;
      env?: Record<string, string | undefined>;
    },
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env },
        shell: false,
        windowsHide: true,
      });
      let stdout = "";
      let stderr = "";
      let outputBytes = 0;
      let settled = false;
      const finish = (
        callback: () => void,
      ) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        callback();
      };
      const append = (current: string, chunk: string) => {
        outputBytes += Buffer.byteLength(chunk);
        if (
          options?.maxOutputBytes &&
          outputBytes > options.maxOutputBytes
        ) {
          child.kill();
          finish(() => reject(new Error("Process output limit exceeded")));
        }
        return current + chunk;
      };
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout = append(stdout, chunk);
      });
      child.stderr.on("data", (chunk: string) => {
        stderr = append(stderr, chunk);
      });

      const timer = options?.timeoutMs
        ? setTimeout(() => {
            child.kill();
            finish(() => reject(new Error("Process timed out")));
          }, options.timeoutMs)
        : undefined;
      child.once("error", (error) => finish(() => reject(error)));
      child.once("close", (code) => {
        finish(() => {
          if (code === 0) resolve({ stdout, stderr });
          else reject(new Error(stderr || `${executable} exited with ${code}`));
        });
      });
    });
  }
}
