import { withPayload } from "@payloadcms/next/withPayload";
import process from "node:process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    const baseline = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      },
      {
        key: "Content-Security-Policy",
        value: "base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'",
      },
      ...(process.env.BETTER_AUTH_URL?.startsWith("https:")
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
        : []),
    ];
    return [
      { source: "/:path*", headers: baseline },
      { source: "/api/v1/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default withPayload(nextConfig);
