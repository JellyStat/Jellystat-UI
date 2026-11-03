import { cn } from './cn';

type VariantMap = Record<string, Record<string, string>>;

export type VariantSelection<V extends VariantMap> = {
  [K in keyof V]?: Extract<keyof V[K], string>;
};

type Config<V extends VariantMap> = {
  base?: string;
  variants: V;
  defaults?: VariantSelection<V>;
};

// Minimal cva-style helper: resolves the selected (or default) class for each variant group.
export function variants<V extends VariantMap>({ base, variants: groups, defaults }: Config<V>) {
  return (selection: VariantSelection<V> = {}, className?: string) =>
    cn(
      base,
      ...Object.keys(groups).map((group) => {
        const key = selection[group] ?? defaults?.[group];
        return key === undefined ? undefined : groups[group][key];
      }),
      className
    );
}
