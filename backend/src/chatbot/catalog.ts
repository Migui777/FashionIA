import type { Dress } from "../types/dress";
import type { Catalog, CatalogRecord } from "./contract";
import mockCatalog from "./fixtures/catalogo-mock.json";

export type CatalogSource = "mock" | "db";

/** Datos ficticios del contrato v0.1 (fixtures). */
export function loadCatalog(): Catalog {
  return { ...(mockCatalog as Omit<Catalog, "mock">), mock: true };
}

const TYPE_WORDS = ["vestido", "traje"];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Convierte un vestido de la base de datos en un registro del catálogo del chatbot. */
export function dressToRecord(dress: Dress): CatalogRecord {
  const firstWord = (dress.category ?? "").split(" ")[0].toLowerCase();
  const type = TYPE_WORDS.includes(firstWord) ? firstWord : "vestido";
  const materials = (dress.materials ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return {
    id: dress.id,
    name: `${capitalize(type)} ${dress.name}`,
    type,
    creator: dress.designer,
    materials,
    inspiration: dress.story,
    colors: (dress.color ?? "").split(/,| y | a /).map((c) => c.trim().toLowerCase()).filter(Boolean),
    style: dress.style,
    season: dress.season,
  };
}

/** Vestidos reales de la app (PostgreSQL). Se consulta en cada solicitud para reflejar cambios. */
export async function loadCatalogFromDb(): Promise<Catalog> {
  // Import diferido: el modo "mock" no necesita Prisma ni la base de datos.
  const { dressRepository } = await import("../repositories/dress.repository");
  const dresses = await dressRepository.findAll();
  return {
    document: "dresses (base de datos)",
    records: dresses.map(dressToRecord),
    mock: false,
    storyAsInspiration: true,
  };
}

export function getCatalogLoader(source: CatalogSource): () => Promise<Catalog> | Catalog {
  return source === "db" ? loadCatalogFromDb : loadCatalog;
}

export function sourceFromEnv(): CatalogSource {
  return (process.env.CHATBOT_SOURCE ?? "mock").toLowerCase() === "db" ? "db" : "mock";
}
