interface BrandMarkProps {
  className?: string;
  variant?: "primary" | "light" | "monochrome" | "currentColor";
  size?: number;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
  role?: string;
}

export function BrandMark({
  className,
  variant = "currentColor",
  size,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
  role,
}: BrandMarkProps) {
  const strokeColor =
    variant === "primary"
      ? "#304d3f"
      : variant === "light"
      ? "#f7f6f0"
      : variant === "monochrome"
      ? "#26372f"
      : "currentColor";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden={ariaHidden ? "true" : undefined}
      aria-label={ariaLabel}
      role={role}
      fill="none"
    >
      <g stroke={strokeColor} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round">
        {/* V arm: left wing to apex, ascending to shared stem */}
        <path d="M 20,27 L 36,73 L 52,27" />
        {/* B stem: central structural spine */}
        <path d="M 52,27 L 52,73" />
        {/* B upper bowl: refined botanical proportion */}
        <path d="M 52,27 C 67,27 76,33 76,44 C 76,48 72,50 65,50 L 52,50" />
        {/* B lower bowl: grounded and balanced */}
        <path d="M 52,50 L 68,50 C 76,50 80,53 80,62 C 80,71 72,73 52,73" />
      </g>
    </svg>
  );
}

interface BrandBadgeProps {
  className?: string;
  variant?: "primary" | "light";
  size?: number;
  "aria-hidden"?: boolean | "true" | "false";
}

export function BrandBadge({
  className,
  variant = "primary",
  size,
  "aria-hidden": ariaHidden = true,
}: BrandBadgeProps) {
  const isLight = variant === "light";
  const ringColor = isLight ? "#f7f6f0" : "#304d3f";
  const innerRing = isLight ? "rgba(255,255,255,0.3)" : "#dce3d8";
  const markColor = isLight ? "#f7f6f0" : "#304d3f";
  const dotColor = isLight ? "#dce3d8" : "#bd775d";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden={ariaHidden ? "true" : undefined}
      fill="none"
    >
      <circle cx="60" cy="60" r="54" stroke={ringColor} strokeWidth="1.8" />
      <circle cx="60" cy="60" r="49" stroke={innerRing} strokeWidth="0.8" />
      <circle cx="60" cy="9.5" r="1.4" fill={dotColor} />
      <circle cx="60" cy="110.5" r="1.4" fill={dotColor} />
      <circle cx="9.5" cy="60" r="1.4" fill={dotColor} />
      <circle cx="111.5" cy="60" r="1.4" fill={dotColor} />
      <g transform="translate(18, 18) scale(0.84)">
        <g stroke={markColor} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 20,27 L 36,73 L 52,27" />
          <path d="M 52,27 L 52,73" />
          <path d="M 52,27 C 67,27 76,33 76,44 C 76,48 72,50 65,50 L 52,50" />
          <path d="M 52,50 L 68,50 C 76,50 80,53 80,62 C 80,71 72,73 52,73" />
        </g>
      </g>
    </svg>
  );
}
