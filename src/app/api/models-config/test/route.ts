import type { ModelTestResponse } from "@/contracts/models";
import { container } from "@/server/composition/container";
import {
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import { parseModelTest } from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute<ModelTestResponse>(async () =>
    container.modelService.testConfig(
      parseModelTest(await readJson(request)),
    ),
  );
}
