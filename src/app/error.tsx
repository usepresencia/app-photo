"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Você pode tentar novamente ou voltar para a home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="font-condensed border border-rose bg-primary px-5 py-3 text-xs uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="font-condensed border border-rose/40 px-5 py-3 text-xs uppercase tracking-[0.22em] text-foreground transition-colors hover:border-rose hover:text-rose"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </div>
  );
}
