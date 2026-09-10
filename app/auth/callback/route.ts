import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function safeNext(value: string | null): string {
  if (value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return value;
  }
  return "/dashboard";
}

function loginRedirect(request: NextRequest, reason: string) {
  const url = new URL("/auth/login", request.url);
  url.searchParams.set("auth", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!code || !url || !key) return loginRedirect(request, "callback");

  const response = NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? loginRedirect(request, "callback") : response;
}
