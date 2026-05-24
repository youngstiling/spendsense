import type { NextRequest } from "next/server";

/** Build redirect URL that works behind Vercel's load balancer. */
export function authRedirectTarget(request: NextRequest, path: string): string {
  const { origin } = new URL(request.url);
  const isLocal = process.env.NODE_ENV === "development";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (isLocal) return `${origin}${path}`;
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}${path}`;
  return `${origin}${path}`;
}

/** Callback URL sent in magic-link emails (client or env). */
export function magicLinkRedirectTo(origin: string): string {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || origin;
  return `${site}/auth/callback`;
}
