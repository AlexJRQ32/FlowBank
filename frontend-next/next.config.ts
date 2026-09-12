import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // tesseract.js spawns a worker thread and loads wasm + traineddata from
  // disk at runtime — must stay external, not bundled.
  serverExternalPackages: [
    "tesseract.js",
    "tesseract.js-core",
    // uses path.join(__dirname, ...) to resolve traineddata — must not bundle
    "@tesseract.js-data/spa",
  ],
  sassOptions: {
    implementation: "sass-embedded",
    // sass-loader's modern API uses loadPaths; includePaths kept for
    // compatibility with the legacy API path.
    loadPaths: ["src/styles"],
    includePaths: ["src/styles"],
  },
};

export default nextConfig;
