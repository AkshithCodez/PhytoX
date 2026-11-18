import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, getSupabaseAnonKey } from "@/lib/supabase/config";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isConfigured()) return response;

  const pathname = request.nextUrl.pathname;
  const isFarmerRoute =
    pathname === "/farmer" || pathname.startsWith("/farmer/");
  const isOfficerRoute =
    pathname === "/officer" || pathname.startsWith("/officer/");

  try {
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (values) => {
            values.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            values.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await client.auth.getUser();

    // Enforce strict server-side protection on protected routes
    if (isFarmerRoute && !user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("portal", "farmer");
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isOfficerRoute && !user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("portal", "officer");
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // If auth session check fails on unauthenticated requests, enforce login redirect for protected routes
    if (isFarmerRoute) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("portal", "farmer");
      return NextResponse.redirect(loginUrl);
    }
    if (isOfficerRoute) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("portal", "officer");
      return NextResponse.redirect(loginUrl);
    }
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/farmer/:path*", "/officer/:path*", "/api/:path*", "/auth/:path*"],
};
