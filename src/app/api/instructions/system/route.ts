import { container } from "@/server/composition/container";
import {
  errorResponse,
  handleRoute,
  readJson,
} from "@/server/transport/http/api-response";
import {
  parseDeleteSystemInstructions,
  parseSaveSystemInstructions,
} from "@/server/transport/http/validators";
import type { SystemInstructionsResponse } from "@/contracts/instructions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute<SystemInstructionsResponse>(() =>
    container.instructionService.getSystem(),
  );
}

export async function PUT(request: Request) {
  try {
    const body = parseSaveSystemInstructions(await readJson(request));
    return handleRoute<SystemInstructionsResponse>(() =>
      container.instructionService.saveSystem(
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
    const body = parseDeleteSystemInstructions(await readJson(request));
    await container.instructionService.deleteSystem(
      body.expectedRevision,
      body.force,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
