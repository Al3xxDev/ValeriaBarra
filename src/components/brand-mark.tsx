import Image from "next/image";

export interface BrandMarkProps {
  className?: string;
  variant?: "primary" | "light" | "monochrome" | "currentColor" | "badge" | "emblem";
  size?: number;
  width?: number;
  height?: number;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
  role?: string;
}

export function BrandMark({
  className,
  size,
  width,
  height,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
  role,
}: BrandMarkProps) {
  // Always render the entire official logo.jpeg in its entirety
  const h = height ?? size ?? 68;
  const w = width ?? Math.round(h * (928 / 1135));

  return (
    <Image
      src="/images/logo.jpeg"
      width={w}
      height={h}
      alt={ariaLabel ?? ""}
      aria-hidden={ariaHidden ? "true" : undefined}
      role={role}
      className={className}
      priority
    />
  );
}

export interface BrandBadgeProps {
  className?: string;
  variant?: "primary" | "light";
  size?: number;
  "aria-hidden"?: boolean | "true" | "false";
}

export function BrandBadge({
  className,
  size = 64,
  "aria-hidden": ariaHidden = true,
}: BrandBadgeProps) {
  const h = size;
  const w = Math.round(h * (928 / 1135));
  return (
    <Image
      src="/images/logo.jpeg"
      width={w}
      height={h}
      alt=""
      aria-hidden={ariaHidden ? "true" : undefined}
      className={className}
      priority
    />
  );
}
