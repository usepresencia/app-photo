import Image from "next/image";
import { getBrand } from "@/actions/brand";

export async function Logo({ className = "" }: { className?: string }) {
  const brand = await getBrand();
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo.svg"
        alt={`${brand.name}, ${brand.tagline}`}
        width={158}
        height={44}
        className="h-11 w-auto"
        priority
      />
    </div>
  );
}
