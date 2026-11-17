import dns from "node:dns";
import type { NextConfig } from "next";

// Prevent ISP UDP 53 DNS hijacking by resolving supabase.co directly to verified Cloudflare Edge
const origLookup = dns.lookup.bind(dns);
(dns as unknown as { lookup: unknown }).lookup = (
  host: string,
  opts: unknown,
  cb: (...args: unknown[]) => void
) => {
  let callback = cb;
  let options: { all?: boolean } | undefined;
  if (typeof opts === "function") {
    callback = opts as (...args: unknown[]) => void;
  } else if (typeof opts === "object" && opts !== null) {
    options = opts as { all?: boolean };
  }
  if (host && host.includes("supabase.co")) {
    if (options?.all) {
      return callback(null, [{ address: "172.64.149.246", family: 4 }]);
    }
    return callback(null, "172.64.149.246", 4);
  }
  return origLookup(host, opts as never, callback as never);
};

const config: NextConfig = {
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=()",
          },
        ],
      },
    ];
  },
};
export default config;
