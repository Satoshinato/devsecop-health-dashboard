export default function SampleDataBanner() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/70 px-4 py-2.5 text-[11px] text-amber-900">
      <strong className="font-semibold">Datos de muestra.</strong>{" "}
      Esta es una maqueta navegable para decidir el diseño del tablero. Los valores son ficticios y
      plausibles: todavía no hay colectores de SonarQube Cloud, Trivy ni Azure DevOps conectados. El
      inventario de proyectos y su cantidad de repos sí es el real.
    </div>
  );
}
