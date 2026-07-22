import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { InstructionStore } from "@/server/ports/instruction-store";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";
import { ABSENT_REVISION } from "@/contracts/instructions";
import { InstructionService } from "./instruction-service";

function setup(registeredRoots: string[] = [path.resolve("project-a")]) {
  const store: InstructionStore = {
    readGlobalAppend: vi.fn(async () => ({
      content: "global content",
      exists: true,
      filePath: "/home/.pi/agent/APPEND_SYSTEM.md",
      revision: "sha256:global",
    })),
    writeGlobalAppend: vi.fn(async (input) => ({
      content: input.content,
      exists: true,
      filePath: "/home/.pi/agent/APPEND_SYSTEM.md",
      revision: "sha256:new-global",
    })),
    deleteGlobalAppend: vi.fn(async () => undefined),
    readProject: vi.fn(async () => ({
      content: "project content",
      exists: true,
      filePath: path.join(path.resolve("project-a"), "AGENTS.md"),
      revision: "sha256:project",
    })),
    writeProject: vi.fn(async (_root, input) => ({
      content: input.content,
      exists: true,
      filePath: path.join(path.resolve("project-a"), "AGENTS.md"),
      revision: "sha256:new-project",
    })),
    deleteProject: vi.fn(async () => undefined),
  };
  const roots: WorkspaceRootProvider = {
    addRoot: vi.fn(),
    listRoots: vi.fn(async () => registeredRoots),
  };
  return { store, roots };
}

describe("InstructionService", () => {
  it("reads global append instructions", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    const result = await service.getSystem();

    expect(result.append.content).toBe("global content");
    expect(result.append.exists).toBe(true);
    expect(store.readGlobalAppend).toHaveBeenCalledOnce();
  });

  it("saves global append instructions with revision check", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    const result = await service.saveSystem(
      "new content",
      "sha256:global",
    );

    expect(result.append.content).toBe("new content");
    expect(store.writeGlobalAppend).toHaveBeenCalledWith({
      content: "new content",
      expectedRevision: "sha256:global",
      force: undefined,
    });
  });

  it("deletes global append instructions", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    await service.deleteSystem("sha256:global");

    expect(store.deleteGlobalAppend).toHaveBeenCalledWith({
      expectedRevision: "sha256:global",
      force: undefined,
    });
  });

  it("reads project instructions for a registered root", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    const result = await service.getProject(path.resolve("project-a"));

    expect(result.project.content).toBe("project content");
    expect(store.readProject).toHaveBeenCalledWith(
      path.resolve("project-a"),
    );
  });

  it("saves project instructions for a registered root", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    const result = await service.saveProject(
      path.resolve("project-a"),
      "new project content",
      "sha256:project",
    );

    expect(result.project.content).toBe("new project content");
    expect(store.writeProject).toHaveBeenCalledWith(
      path.resolve("project-a"),
      {
        content: "new project content",
        expectedRevision: "sha256:project",
        force: undefined,
      },
    );
  });

  it("deletes project instructions for a registered root", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    await service.deleteProject(
      path.resolve("project-a"),
      "sha256:project",
    );

    expect(store.deleteProject).toHaveBeenCalledWith(
      path.resolve("project-a"),
      {
        expectedRevision: "sha256:project",
        force: undefined,
      },
    );
  });

  it("rejects project operations for unregistered roots", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    await expect(service.getProject("/unregistered")).rejects.toThrow(
      "not registered",
    );
    await expect(
      service.saveProject("/unregistered", "x", ABSENT_REVISION),
    ).rejects.toThrow("not registered");
    await expect(
      service.deleteProject("/unregistered", ABSENT_REVISION),
    ).rejects.toThrow("not registered");
  });

  it("rejects empty cwd", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    await expect(service.getProject("")).rejects.toThrow("required");
    await expect(
      service.saveProject("", "x", ABSENT_REVISION),
    ).rejects.toThrow("required");
  });

  it("rejects oversized content", async () => {
    const { store, roots } = setup();
    const service = new InstructionService(store, roots);

    const huge = "x".repeat(64 * 1024 + 1);
    await expect(
      service.saveSystem(huge, "sha256:global"),
    ).rejects.toThrow("exceeds");
    await expect(
      service.saveProject(path.resolve("project-a"), huge, "sha256:project"),
    ).rejects.toThrow("exceeds");
  });
});
