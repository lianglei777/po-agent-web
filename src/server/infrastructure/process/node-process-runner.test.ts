import { describe, expect, it } from "vitest";
import { NodeProcessRunner } from "./node-process-runner";

describe("NodeProcessRunner", () => {
  it("passes metacharacters as literal arguments without a shell", async () => {
    const runner = new NodeProcessRunner();
    const result = await runner.run(
      process.execPath,
      ["-e", "process.stdout.write(process.argv[1])", "value; echo unsafe"],
      { timeoutMs: 5_000, maxOutputBytes: 1024 },
    );

    expect(result.stdout).toBe("value; echo unsafe");
  });

  it("rejects output beyond the configured limit", async () => {
    const runner = new NodeProcessRunner();
    await expect(
      runner.run(
        process.execPath,
        ["-e", "process.stdout.write('x'.repeat(2048))"],
        { timeoutMs: 5_000, maxOutputBytes: 100 },
      ),
    ).rejects.toThrow("output limit");
  });
});
