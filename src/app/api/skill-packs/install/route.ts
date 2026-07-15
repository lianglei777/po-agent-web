import type { SkillPackLoadResponse } from "@/contracts/skill-packs";
import { container } from "@/server/composition/container";
import {
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import { parseSkillPackInstall } from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute<SkillPackLoadResponse>(async () =>
    container.skillPackService.install(
      parseSkillPackInstall(await readJson(request)),
    ),
  );
}
