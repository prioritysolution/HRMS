import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md";
  className?: string;
};

export function BrandMark({
  href = "/dashboard",
  size = "sm",
  className,
}: BrandMarkProps) {
  const sizeClass =
    size === "md"
      ? "brand-mark brand-mark--md"
      : "brand-mark brand-mark--sm";

  return (
    <Link href={href} className={`${sizeClass} ${className ?? ""}`} aria-label="PrioHRM home">
      <Image
        src="/images/logos/prio-hrm-mark.png"
        alt="PrioHRM"
        width={size === "md" ? 40 : 32}
        height={size === "md" ? 40 : 32}
        className="brand-mark-img"
        priority
      />
    </Link>
  );
}
