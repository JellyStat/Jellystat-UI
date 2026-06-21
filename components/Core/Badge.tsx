export type Props = {
  shape?: "rounded" | "square";
  value: string;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
};

export default function Badge({
  value,
  shape = "rounded",
  bgColor = "bg-brand-cyan/10",
  textColor = "text-brand-cyan",
  borderColor = "border-brand-cyan/20",
}: Props) {
  return (
    <div
      className={`flex items-center px-2.5 py-1 ${shape === "rounded" ? "rounded-full" : "rounded-md"} ${bgColor} border ${borderColor} shrink-0`}
    >
      <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{value}</span>
    </div>
  );
}
