import type { SkillPackLoadResponse } from "@/contracts/skill-packs";
import { container } from "@/server/composition/container";
import {
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import { parseSkillPackRemove } from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleRoute<SkillPackLoadResponse>(() => {
    const cwd = new URL(request.url).searchParams.get("cwd") ?? "";
    return container.skillPackService.list(cwd);
  });
}

export async function DELETE(request: Request) {
  return handleRoute<SkillPackLoadResponse>(async () =>
    container.skillPackService.remove(
      parseSkillPackRemove(await readJson(request)),
    ),
  );
}
