/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxied requests (see rewrites below) clone the body in dev; default is 10MB.
  // Large file uploads were truncated → broken multipart → API 500. Match API max upload.
  experimental: {
    middlewareClientMaxBodySize: "500mb",
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${api}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
