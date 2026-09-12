import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    implementation: "sass-embedded",
    // sass-loader's modern API uses loadPaths; includePaths kept for
    // compatibility with the legacy API path.
    loadPaths: ["src/styles"],
    includePaths: ["src/styles"],
  },
};

export default nextConfig;
