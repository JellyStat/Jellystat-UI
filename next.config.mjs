// next.config.mjs
import bundleAnalyzer from "@next/bundle-analyzer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  distDir: "out",
  output: "export",
  trailingSlash: true, // Crucial step
});
