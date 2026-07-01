import type { CreateAgentResponse } from "@/contracts/agent";
import { container } from "@/server/composition/container";
import {
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import { parseCreateAgent } from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute<CreateAgentResponse>(async () =>
    container.agentService.create(
      parseCreateAgent(await readJson(request)),
    ),
  );
}
