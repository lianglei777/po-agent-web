import { describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  createAgentSession: vi.fn(),
  createSessionManager: vi.fn(),
}));
const resources = vi.hoisted(() => ({
  createPiResourceLoader: vi.fn(),
}));

vi.mock("@earendil-works/pi-coding-agent", () => ({
  createAgentSession: sdk.createAgentSession,
  findCutPoint: vi.fn(),
  SessionManager: {
    create: sdk.createSessionManager,
    open: vi.fn(),
  },
}));
vi.mock("./pi-resource-loader", () => ({
  createPiResourceLoader: resources.createPiResourceLoader,
}));

import { PiAgentRuntimeFactory } from "./pi-agent-runtime";

describe("PiAgentRuntimeFactory", () => {
  it("enables the full built-in tool set by default", async () => {
    sdk.createSessionManager.mockReturnValue({});
    sdk.createAgentSession.mockResolvedValue({ session: {} });
    const resourceLoader = { reload: vi.fn() };
    resources.createPiResourceLoader.mockResolvedValue(resourceLoader);

    await new PiAgentRuntimeFactory().create({ cwd: "C:\\workspace" });

    expect(resources.createPiResourceLoader).toHaveBeenCalledWith({
      cwd: "C:\\workspace",
    });
    expect(sdk.createAgentSession).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceLoader,
        tools: ["bash", "read", "edit", "write", "grep", "find", "ls"],
      }),
    );
  });
});
