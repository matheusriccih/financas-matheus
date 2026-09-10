export function authCallbackUrl(next: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin = configuredOrigin || window.location.origin;
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}
