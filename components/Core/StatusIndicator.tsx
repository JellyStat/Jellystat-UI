export type Props = {
  color?: string; // Tailwind background class, e.g. 'bg-green-500' or 'bg-brand-emerald'
};

export default function StatusIndicator({ color = "bg-brand-emerald" }: Props) {
  const useClass = typeof color === "string" && (color.startsWith("bg-") || color.split(" ").some((c) => c.startsWith("bg-")));

  const pingProps = useClass
    ? { className: `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}` }
    : { className: `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`, style: { backgroundColor: color } };

  const dotProps = useClass
    ? { className: `relative inline-flex rounded-full h-3 w-3 ${color}` }
    : { className: `relative inline-flex rounded-full h-3 w-3`, style: { backgroundColor: color } };

  return (
    <div className="relative flex h-3 w-3">
      <span {...(pingProps as any)} />
      <span {...(dotProps as any)} />
    </div>
  );
}
