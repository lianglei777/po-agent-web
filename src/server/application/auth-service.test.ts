import { describe, expect, it, vi } from "vitest";
import type { CredentialProvider } from "@/server/ports/credential-provider";
import { AuthService } from "./auth-service";

describe("AuthService", () => {
  it("returns configured API key providers with model counts in one application call", async () => {
    const service = new AuthService(
      {
        listConfiguredApiKeyProviders: vi.fn().mockResolvedValue([
          {
            id: "anthropic",
            name: "Anthropic",
            configured: true,
            source: "stored",
            label: "Stored API key",
          },
          {
            id: "openai",
            name: "OpenAI",
            configured: true,
            source: "environment",
            label: "Environment variable",
          },
        ]),
      } as unknown as CredentialProvider,
      { create: vi.fn(), resolve: vi.fn(), rejectProvider: vi.fn() },
    );

    await expect(
      service.listConfiguredApiKeyProviders({
        anthropic: 2,
        openai: 0,
      }),
    ).resolves.toEqual([
      {
        id: "anthropic",
        name: "Anthropic",
        configured: true,
        source: "stored",
        label: "Stored API key",
        modelCount: 2,
      },
      {
        id: "openai",
        name: "OpenAI",
        configured: true,
        source: "environment",
        label: "Environment variable",
        modelCount: 0,
      },
    ]);
  });
});
