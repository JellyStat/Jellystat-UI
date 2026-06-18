// next.config.mjs
import bundleAnalyzer from "@next/bundle-analyzer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const i18nConfig = require("./next-i18next.config.js");

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  i18n: i18nConfig.i18n,
});