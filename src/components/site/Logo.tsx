import { BRAND } from "./data";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="frame-gold grid h-11 w-11 shrink-0 place-items-center bg-surface-2">
        <span className="font-display text-2xl leading-none text-gold">dg</span>
      </div>
      <div className="min-w-0 text-left">
        <p className="font-display truncate text-xl leading-none tracking-[0.16em] text-foreground">
          {BRAND.name}
        </p>
        <p className="font-condensed mt-1 text-[0.6rem] uppercase tracking-[0.4em] text-gold">
          {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}
