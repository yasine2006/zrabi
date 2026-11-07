"use client";

import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full border border-line bg-surface text-terracotta">
        <RefreshCw className="h-7 w-7" />
      </span>
      <p className="eyebrow mt-6">Erreur</p>
      <h1 className="mt-2 max-w-xl text-balance font-serif text-4xl font-semibold leading-[1.02] sm:text-5xl">
        Une erreur est survenue.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        La page n’a pas pu se charger. Réessayez dans un instant, ou revenez à
        l’accueil.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          Réessayer
        </button>
        <Link href="/" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
