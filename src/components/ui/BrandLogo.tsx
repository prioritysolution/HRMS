import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const LOGO_LIGHT_SRC = "/images/logos/logo-light.png";
const LOGO_DARK_SRC = "/images/logos/logo-dark.png";

const SIZE_MAP = {
  sm: { width: 150, height: 50 },
  md: { width: 210, height: 70 },
  lg: { width: 240, height: 80 },
} as const;

export function BrandLogo({
  href = "/dashboard",
  size = "md",
  className,
}: BrandLogoProps) {
  const dimensions = SIZE_MAP[size];

  const imageProps = {
    alt: "PrioHRM",
    width: dimensions.width,
    height: dimensions.height,
    sizes: "(max-width: 768px) 42vw, 240px" as const,
    priority: true,
  };

  return (
    <Link href={href} className={`brand-logo ${className ?? ""}`} aria-label="PrioHRM home">
      <Image
        {...imageProps}
        src={LOGO_LIGHT_SRC}
        className="brand-logo-img logo-light"
      />
      <Image
        {...imageProps}
        src={LOGO_DARK_SRC}
        className="brand-logo-img logo-dark"
        aria-hidden
      />
    </Link>
  );
}
