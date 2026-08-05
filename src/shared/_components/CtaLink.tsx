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
  "font-condensed text-center text-xs font-semibold uppercase tracking-[0.22em] transition-colors";
const variants = {
  solid: "bg-gold px-5 py-3 text-background hover:opacity-85",
  outline: "border border-gold/40 px-5 py-3 text-foreground hover:border-gold hover:text-gold",
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
