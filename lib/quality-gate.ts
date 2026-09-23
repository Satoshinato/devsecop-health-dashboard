/** Condiciones del "QA Quality Gate" propio (Clean as You Code / new code). */
export const QUALITY_GATE = {
  nombre: "QA Quality Gate",
  alcance: "Solo código nuevo (Clean as You Code)",
  condiciones: [
    { metrica: "Issues", operador: "mayor que", valor: "0" },
    { metrica: "Security Hotspots revisados", operador: "menor que", valor: "100%" },
    { metrica: "Cobertura", operador: "menor que", valor: "80,0%" },
    { metrica: "Líneas duplicadas", operador: "mayor que", valor: "3,0%" },
    { metrica: "Rating de mantenibilidad", operador: "peor que", valor: "A" },
    { metrica: "Rating de confiabilidad", operador: "peor que", valor: "A" },
    { metrica: "Rating de seguridad", operador: "peor que", valor: "A" },
  ],
};

export const ALCANCE_TRIVY = "Solo imágenes de contenedor";

export const AZDO_ORG_DEFAULT = "accusystechnology";
export const SONAR_ORG_DEFAULT = "accusys";
export const AZDO_BASE_URL = `https://dev.azure.com/${AZDO_ORG_DEFAULT}`;
export const SONAR_BASE_URL = "https://sonarcloud.io";
