import i18next from "i18next";

// Report designer strings. Translated when called, so option lists built at module load
// use getters. Without vars, {{tokens}} in the text are shown as written, not interpolated.
export function dt(key: string, defaultValue: string, vars?: Record<string, unknown>): string {
  return vars
    ? i18next.t(key, { defaultValue, ...vars })
    : i18next.t(key, { defaultValue, skipInterpolation: true });
}
