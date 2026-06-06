import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  output: "export", // Compiles the app into a static directory
  trailingSlash: true,
  allowedDevOrigins: ["10.0.0.20"],
});
