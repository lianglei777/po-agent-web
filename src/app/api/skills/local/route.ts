import type { CreateLocalSkillResponse } from "@/contracts/skills";
import { container } from "@/server/composition/container";
import {
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import { parseSkillCreateLocal } from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute<CreateLocalSkillResponse>(async () =>
    container.skillService.importLocal(
      parseSkillCreateLocal(await readJson(request)),
    ),
  );
}
