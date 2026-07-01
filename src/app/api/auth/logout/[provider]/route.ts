import type { LogoutOAuthResponse } from "@/contracts/auth";
import { container } from "@/server/composition/container";
import { handleRoute } from "@/server/transport/http/api-response";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  return handleRoute<LogoutOAuthResponse>(async () => {
    const { provider } = await context.params;
    await container.authService.logout(provider);
    return { success: true };
  });
}

