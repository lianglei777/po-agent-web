import type { ModelsResponse } from "@/contracts/models";
import { container } from "@/server/composition/container";
import { handleRoute } from "@/server/transport/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  return handleRoute<ModelsResponse>(async () => ({
    models: await container.modelService.listAvailable(),
    defaultModel: await container.modelService.getDefault(),
  }));
}

