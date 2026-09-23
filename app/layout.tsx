import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevSecOps health (Deuda Técnica)",
  description:
    "Tablero DevSecOps de Accusys: deuda técnica, adopción de SonarQube y Trivy por proyecto de Azure DevOps.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100">
        <div className="px-6 py-6">
          <div className="mx-auto flex max-w-[1380px] flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
