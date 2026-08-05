import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CtaLinkProps = {
  href: string;
  variant?: "solid" | "outline";
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "className">;

const base =
  "font-condensed text-center text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors sm:text-xs sm:tracking-[0.22em]";
const variants = {
  solid: "bg-gold px-4 py-2.5 text-background hover:opacity-85 sm:px-5 sm:py-3",
  outline:
    "border border-gold/40 px-4 py-2.5 text-foreground hover:border-gold hover:text-gold sm:px-5 sm:py-3",
};

export function CtaLink({
  href,
  variant = "solid",
  external = false,
  className = "",
  children,
  ...rest
}: CtaLinkProps) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
