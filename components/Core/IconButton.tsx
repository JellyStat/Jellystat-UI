import { LucideIcon } from "lucide-react";

export type Props = {
  shape?: "rounded" | "square";
  tooltip?: string;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export default function IconButton({
  icon: Icon,
  shape = "square",
  tooltip,
  className = "",
  iconClassName = "",
  onClick,
  disabled = false,
}: Props) {
  return (
    <button
      className={`flex items-center px-2.5 py-1 ${shape === "rounded" ? "rounded-full" : "rounded-md"} ${className} shrink-0 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={disabled ? undefined : onClick}
      type="button"
      disabled={disabled}
      title={tooltip}
    >
      <Icon className={`text-[10px] font-black uppercase tracking-widest ${iconClassName}`} />
    </button>
  );
}
