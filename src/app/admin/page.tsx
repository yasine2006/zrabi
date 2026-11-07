import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/data";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  description:
    "Back-office Zarbia Atlas — catalogue, commandes, sur-mesure, livraison et taux de change.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    return <AdminLogin />;
  }

  try {
    const data = await getAdminDashboardData();

    return (
      <AdminDashboard
        session={{
          userId: session.userId,
          email: session.email,
          name: session.name,
          role: session.role,
        }}
        data={data}
      />
    );
  } catch (error) {
    console.error("[admin] Failed to load dashboard data:", error);

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
        <div className="max-w-md rounded-3xl border border-line bg-surface/70 p-8 text-center shadow-soft">
          <AlertTriangle className="mx-auto h-6 w-6 text-terracotta" />
          <h1 className="mt-4 text-xl text-ink">
            Données indisponibles
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Le back-office n’arrive pas à joindre la base de données.
            Vérifiez que PostgreSQL est démarré, puis rechargez cette page.
          </p>
        </div>
      </main>
    );
  }
}
