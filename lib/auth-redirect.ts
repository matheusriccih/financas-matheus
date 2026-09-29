export function authCallbackUrl(next: string): string {
  // This runs in the browser. Using the current origin keeps recovery and
  // confirmation links on the deployment the user is actually visiting.
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function safeInternalPath(value: string | null, fallback = "/dashboard"): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}
