import { container } from "@/server/composition/container";
import {
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import { parseModelsConfig } from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function GET() {
  return handleRoute(() => container.modelService.readConfig());
}

export async function PUT(request: Request) {
  return handleRoute(async () => {
    await container.modelService.writeConfig(
      parseModelsConfig(await readJson(request)),
    );
    return { success: true };
  });
}

