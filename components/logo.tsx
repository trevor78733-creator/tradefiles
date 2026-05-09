import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "size-5" : "size-6";
  const textSize = size === "sm" ? "text-base" : "text-xl";
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 group", className)}
      aria-label="tradefiles"
    >
      <svg
        viewBox="0 0 24 24"
        className={cn(iconSize, "shrink-0")}
        aria-hidden
      >
        <rect x="2" y="14" width="5" height="8" rx="1" fill="currentColor" />
        <rect x="9.5" y="8" width="5" height="14" rx="1" fill="currentColor" />
        <rect
          x="17"
          y="2"
          width="5"
          height="20"
          rx="1"
          fill="var(--chart-positive)"
        />
      </svg>
      <span className={cn(textSize, "font-bold tracking-tight leading-none")}>
        <span>trade</span>
        <span style={{ color: "var(--chart-positive)" }}>files</span>
      </span>
    </Link>
  );
}
