import DetalleClient from "@/components/devsecops/DetalleClient";
import { projectKeysFromYml } from "@/lib/project-keys";

export const dynamicParams = false;

export function generateStaticParams() {
  return projectKeysFromYml().map(proyecto => ({ proyecto }));
}

export default async function DetalleProyectoPage({
  params,
}: {
  params: Promise<{ proyecto: string }>;
}) {
  const { proyecto } = await params;
  return <DetalleClient proyecto={proyecto} />;
}
