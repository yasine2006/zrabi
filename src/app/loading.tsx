import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4 text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
        <p className="text-[0.72rem] uppercase tracking-[0.18em]">
          Zarbia Atlas
        </p>
      </div>
    </div>
  );
}
