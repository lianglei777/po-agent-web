import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ABSENT_REVISION } from "@/contracts/instructions";
import { NodeInstructionStore } from "./node-instruction-store";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((value) => fs.rm(value, { force: true, recursive: true })),
  );
});

async function createTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "po-instructions-"));
  temporaryDirectories.push(dir);
  return dir;
}

describe("NodeInstructionStore", () => {
  it("reads absent global append as empty with absent revision", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    const result = await store.readGlobalAppend();

    expect(result.content).toBe("");
    expect(result.exists).toBe(false);
    expect(result.revision).toBe(ABSENT_REVISION);
  });

  it("writes and reads global append", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    const written = await store.writeGlobalAppend({
      content: "global prompt",
      expectedRevision: ABSENT_REVISION,
    });

    expect(written.exists).toBe(true);
    expect(written.content).toBe("global prompt");
    expect(written.revision).not.toBe(ABSENT_REVISION);

    const read = await store.readGlobalAppend();
    expect(read.content).toBe("global prompt");
    expect(read.exists).toBe(true);
    expect(read.revision).toBe(written.revision);
  });

  it("rejects write with stale revision", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    await store.writeGlobalAppend({
      content: "v1",
      expectedRevision: ABSENT_REVISION,
    });

    await expect(
      store.writeGlobalAppend({
        content: "v2",
        expectedRevision: "sha256:stale",
      }),
    ).rejects.toThrow("modified by another process");
  });

  it("allows force write to override revision check", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    await store.writeGlobalAppend({
      content: "v1",
      expectedRevision: ABSENT_REVISION,
    });

    const result = await store.writeGlobalAppend({
      content: "v2",
      expectedRevision: "sha256:stale",
      force: true,
    });

    expect(result.content).toBe("v2");
  });

  it("deletes existing global append", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    const written = await store.writeGlobalAppend({
      content: "to delete",
      expectedRevision: ABSENT_REVISION,
    });

    await store.deleteGlobalAppend({ expectedRevision: written.revision });

    const read = await store.readGlobalAppend();
    expect(read.exists).toBe(false);
    expect(read.content).toBe("");
  });

  it("delete is idempotent for absent file", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    await store.deleteGlobalAppend({ expectedRevision: ABSENT_REVISION });
  });

  it("rejects delete with stale revision", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    await store.writeGlobalAppend({
      content: "to delete",
      expectedRevision: ABSENT_REVISION,
    });

    await expect(
      store.deleteGlobalAppend({ expectedRevision: "sha256:stale" }),
    ).rejects.toThrow("modified by another process");
  });

  it("writes and reads project AGENTS.md", async () => {
    const projectDir = await createTempDir();
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    const written = await store.writeProject(projectDir, {
      content: "# Project Instructions",
      expectedRevision: ABSENT_REVISION,
    });

    expect(written.exists).toBe(true);
    expect(written.content).toBe("# Project Instructions");

    const read = await store.readProject(projectDir);
    expect(read.content).toBe("# Project Instructions");
    expect(read.exists).toBe(true);
  });

  it("rejects a project AGENTS.md symlink that escapes the project root", async () => {
    const projectDir = await createTempDir();
    const outsideDir = await createTempDir();
    const agentDir = await createTempDir();
    await fs.symlink(outsideDir, path.join(projectDir, "AGENTS.md"), "junction");
    const store = new NodeInstructionStore(agentDir);

    await expect(store.readProject(projectDir)).rejects.toThrow(
      "outside the configured workspace root",
    );
  });

  it("deletes project AGENTS.md", async () => {
    const projectDir = await createTempDir();
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    const written = await store.writeProject(projectDir, {
      content: "# To Delete",
      expectedRevision: ABSENT_REVISION,
    });

    await store.deleteProject(projectDir, { expectedRevision: written.revision });

    const read = await store.readProject(projectDir);
    expect(read.exists).toBe(false);
  });

  it("rejects oversized content", async () => {
    const agentDir = await createTempDir();
    const store = new NodeInstructionStore(agentDir);

    const huge = "x".repeat(64 * 1024 + 1);

    await expect(
      store.writeGlobalAppend({
        content: huge,
        expectedRevision: ABSENT_REVISION,
      }),
    ).rejects.toThrow("exceeds");
  });
});
