import { BRAND } from "./data";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface-2">
        <span className="font-display text-xl leading-none text-foreground">dg</span>
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-bold uppercase leading-none tracking-[0.18em] text-foreground">
          {BRAND.name}
        </p>
        <p className="mt-1 text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">
          {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}
