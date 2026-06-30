import { container } from "@/server/composition/container";
import {
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import {
  asObject,
  requiredBoolean,
  requiredString,
  optionalString,
  parseSkillRemove,
} from "@/server/transport/http/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleRoute(() => {
    const cwd = new URL(request.url).searchParams.get("cwd") ?? "";
    return container.skillService.load(cwd);
  });
}

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const body = asObject(await readJson(request));
    return container.skillService.setModelInvocationDisabled({
      cwd: requiredString(body, "cwd"),
      skillId: requiredString(body, "skillId"),
      disabled: requiredBoolean(body, "disabled"),
      expectedVersion: optionalString(body, "expectedVersion"),
    });
  });
}

export async function DELETE(request: Request) {
  return handleRoute(async () =>
    container.skillService.remove(
      parseSkillRemove(await readJson(request)),
    ),
  );
}
