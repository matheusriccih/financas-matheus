export function authCallbackUrl(next: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin = configuredOrigin || window.location.origin;
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function safeInternalPath(value: string | null, fallback = "/dashboard"): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}
