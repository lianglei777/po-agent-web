import { container } from "@/server/composition/container";
import { AppError } from "@/server/domain/app-error";
import {
  errorResponse,
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import {
  parseDeleteProjectInstructions,
  parseSaveProjectInstructions,
} from "@/server/transport/http/validators";
import type { ProjectInstructionsResponse } from "@/contracts/instructions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cwd = url.searchParams.get("cwd");
  if (!cwd) {
    return errorResponse(
      new AppError("VALIDATION_ERROR", "Query parameter 'cwd' is required", 400),
    );
  }
  return handleRoute<ProjectInstructionsResponse>(() =>
    container.instructionService.getProject(cwd),
  );
}

export async function PUT(request: Request) {
  try {
    const body = parseSaveProjectInstructions(await readJson(request));
    return handleRoute<ProjectInstructionsResponse>(() =>
      container.instructionService.saveProject(
        body.cwd,
        body.content,
        body.expectedRevision,
        body.force,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = parseDeleteProjectInstructions(await readJson(request));
    await container.instructionService.deleteProject(
      body.cwd,
      body.expectedRevision,
      body.force,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
