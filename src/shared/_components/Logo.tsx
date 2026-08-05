import Image from "next/image";
import { getBrand } from "@/actions/brand";

export async function Logo({ className = "" }: { className?: string }) {
  const brand = await getBrand();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="frame-gold grid h-11 w-11 shrink-0 place-items-center bg-surface-2">
        <Image src="/logo.svg" alt="" width={28} height={28} />
      </div>
      <div className="min-w-0 text-left">
        <p className="font-display truncate text-xl leading-none tracking-[0.16em] text-foreground">
          {brand.name}
        </p>
        <p className="font-condensed mt-1 text-[0.6rem] uppercase tracking-[0.4em] text-gold">
          {brand.tagline}
        </p>
      </div>
    </div>
  );
}
