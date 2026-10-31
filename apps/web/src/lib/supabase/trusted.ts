import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/server";
export function trustedClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new ApiError(
      503,
      "unconfigured",
      "Trusted inference persistence has not been configured.",
    );
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
