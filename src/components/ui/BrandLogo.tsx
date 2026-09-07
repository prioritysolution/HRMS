import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_MAP = {
  sm: { width: 96, height: 28 },
  md: { width: 160, height: 42 },
  lg: { width: 220, height: 58 },
} as const;

export function BrandLogo({
  href = "/dashboard",
  size = "md",
  className,
}: BrandLogoProps) {
  const dimensions = SIZE_MAP[size];

  return (
    <Link href={href} className={`brand-logo ${className ?? ""}`} aria-label="PrioHRM home">
      <Image
        // src="/images/logos/prio-hrm-logo.png"
        src="/images/logos/logo.jpeg"
        alt="PrioHRM"
        width={dimensions.width}
        height={dimensions.height}
        sizes="(max-width: 768px) 28vw, 180px"
        className="brand-logo-img"
        priority
      />
    </Link>
  );
}
