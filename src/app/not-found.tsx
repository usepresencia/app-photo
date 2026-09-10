import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="display-xl text-7xl text-rose">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="font-condensed mt-6 inline-flex items-center justify-center border border-rose/40 px-5 py-3 text-xs uppercase tracking-[0.22em] text-foreground transition-colors hover:border-rose hover:text-rose"
        >
          Voltar para a home
        </Link>
      </div>
    </div>
  );
}
