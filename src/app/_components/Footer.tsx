import { FaInstagram } from "react-icons/fa";
import { getBrand } from "@/actions/brand";
import { Logo } from "@/shared/_components/Logo";

export async function Footer() {
  const brand = await getBrand();
  const year = new Date().getFullYear();

  return (
    <footer className="px-5 py-10 text-center">
      <div
        aria-hidden="true"
        className="mx-auto h-px w-full max-w-3xl"
        style={{
          background: "linear-gradient(to right, transparent, var(--gold), transparent)",
          opacity: 0.7,
        }}
      />
      <div className="relative mx-auto mt-8 flex w-full max-w-3xl items-center justify-center">
        <Logo />
        <a
          href={brand.instagram}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-gold transition-opacity hover:opacity-70"
        >
          <FaInstagram className="size-6" />
        </a>
      </div>
      <p className="font-condensed mt-4 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
        Todos os direitos reservados © {year} {brand.name}
      </p>
      <p className="font-condensed mt-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
        {brand.city}
      </p>
    </footer>
  );
}
