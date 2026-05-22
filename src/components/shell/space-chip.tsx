import { cn } from "@/lib/utils";
import { getIconByName } from "@/lib/space-customization";

type SpaceChipProps = {
  iniciais: string;
  cor: string;
  iconName?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const SIZE_BOX: Record<NonNullable<SpaceChipProps["size"]>, string> = {
  xs: "size-4 text-[9px] rounded",
  sm: "size-5 text-[10px] rounded",
  md: "size-7 text-[12px] rounded-md",
  lg: "size-10 text-[15px] rounded-md",
};

const SIZE_ICON: Record<NonNullable<SpaceChipProps["size"]>, string> = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

export function SpaceChip({
  iniciais,
  cor,
  iconName,
  size = "sm",
  className,
}: SpaceChipProps) {
  const Icon = getIconByName(iconName);

  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center font-semibold text-white",
        SIZE_BOX[size],
        className,
      )}
      style={{ background: cor }}
    >
      {Icon ? (
        <Icon className={SIZE_ICON[size]} strokeWidth={2.25} />
      ) : (
        iniciais || "?"
      )}
    </div>
  );
}
