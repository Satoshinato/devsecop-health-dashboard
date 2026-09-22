import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevSecOps health (Deuda Técnica) · Accusys (maqueta)",
  description:
    "Maqueta navegable del tablero DevSecOps de Accusys: deuda técnica, adopción de SonarQube y Trivy por proyecto de Azure DevOps. Datos de muestra.",
};

export default function DevSecOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-amber-400 px-6 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-950">
        Maqueta con datos de muestra · pendiente de aprobación de diseño
      </div>
      <div className="px-6 py-6">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
