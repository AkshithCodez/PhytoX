import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, getSupabaseAnonKey } from "@/lib/supabase/config";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isConfigured()) return response;
  try {
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (values) => {
            values.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            values.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    await client.auth.getUser();
  } catch {
    // If auth session check fails on unauthenticated requests, do not crash the request
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/farmer/:path*", "/officer/:path*", "/api/:path*", "/auth/:path*"],
};
