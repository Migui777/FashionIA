/**
 * Prendas de la simulación del Home. Coinciden con el catálogo de demostración
 * del chatbot (backend/src/chatbot/fixtures/catalogo-mock.json) para que el chat
 * pueda responder sobre ellas. Se reemplaza cuando exista el reconocimiento real.
 */
export interface DemoGarment {
  /** Nombre completo, tal como lo reconoce el chatbot. */
  name: string;
  creator: string;
  collection: string;
  summary: string;
}

export const DEMO_GARMENTS: DemoGarment[] = [
  {
    name: "Vestido Aurora de Jardín",
    creator: "Elena Mar de Luz",
    collection: "Jardines al amanecer",
    summary: "Algodón orgánico y tul reciclado con bordado de seda, inspirado en las flores con la brisa.",
  },
  {
    name: "Traje Bruma Andina",
    creator: "Casa Ladera",
    collection: "Montañas y neblina",
    summary: "Lana fría con forro de cupro y botones de corozo, como las siluetas de la montaña.",
  },
  {
    name: "Vestido Eclipse de Cobre",
    creator: "Taller Nube Roja",
    collection: "Luz y sombra",
    summary: "Lino y satén de viscosa con apliques de cobre envejecido.",
  },
  {
    name: "Traje Jardín Nocturno",
    creator: "Mateo del Río",
    collection: "Flores de noche",
    summary: "Terciopelo de algodón y seda con botones metálicos reciclados.",
  },
];
