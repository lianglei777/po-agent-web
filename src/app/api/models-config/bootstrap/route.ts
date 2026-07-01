import type { ModelsConfigBootstrapResponse } from "@/contracts/models";
import { container } from "@/server/composition/container";
import { handleRoute } from "@/server/transport/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  return handleRoute<ModelsConfigBootstrapResponse>(async () => {
    const [config, oauthProviders, models] = await Promise.all([
      container.modelService.readConfig(),
      container.authService.listOAuthProviders(),
      container.modelService.listAvailable(),
    ]);
    const modelCounts = models.reduce<Record<string, number>>((counts, model) => {
      counts[model.provider] = (counts[model.provider] ?? 0) + 1;
      return counts;
    }, {});
    const apiKeyProviders =
      await container.authService.listConfiguredApiKeyProviders(modelCounts);

    return {
      config,
      oauthProviders,
      apiKeyProviders,
    };
  });
}
