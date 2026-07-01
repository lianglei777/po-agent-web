import type { OAuthProvidersResponse } from "@/contracts/auth";
import { container } from "@/server/composition/container";
import { handleRoute } from "@/server/transport/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  return handleRoute<OAuthProvidersResponse>(() =>
    container.authService.listOAuthProviders(),
  );
}

