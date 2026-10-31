import { PrismaClient, AREffectType } from "@prisma/client";

const prisma = new PrismaClient();

const dresses = [
  {
    name: "Aurora",
    description:
      "Un vestido etéreo inspirado en el amanecer, con capas de tul que capturan la luz en movimiento.",
    designer: "Valentina Ruiz",
    collection: "Amanecer Eterno",
    category: "Vestido de gala",
    color: "Rosa dorado",
    style: "Romántico y etéreo, de capas ligeras",
    season: "Primavera-verano",
    materials: "Tul de seda, hilo metálico, organza",
    imageUrl: "/dresses/aurora.svg",
    model3dUrl: null,
    arEffectType: AREffectType.particles,
    arEffectAssetUrl: null,
    arEffectIntensity: 0.7,
    story:
      "Aurora nace de la observación del cielo justo antes del amanecer, cuando la luz cálida se mezcla con los últimos tonos de la noche. Cada capa de tul representa un minuto de esa transición.",
  },
  {
    name: "Eclipse",
    description:
      "Silueta oscura y estructurada que juega con la ausencia y presencia de luz sobre telas satinadas.",
    designer: "Mateo Londoño",
    collection: "Fenómenos",
    category: "Vestido de noche",
    color: "Negro profundo",
    style: "Dramático y estructurado, de inspiración nocturna",
    season: "Otoño-invierno",
    materials: "Satín, tafetán, cristales de vidrio reciclado",
    imageUrl: "/dresses/eclipse.svg",
    model3dUrl: null,
    arEffectType: AREffectType.glow,
    arEffectAssetUrl: null,
    arEffectIntensity: 0.8,
    story:
      "Eclipse explora el instante en que la luz desaparece por completo. La colección 'Fenómenos' busca traducir eventos astronómicos en prendas que se mueven como sombras vivas.",
  },
  {
    name: "Nébula",
    description:
      "Vestido de corte fluido con degradado de colores que evoca la formación de una nube estelar.",
    designer: "Valentina Ruiz",
    collection: "Fenómenos",
    category: "Vestido de gala",
    color: "Violeta a azul",
    style: "Fluido y artístico, con degradado teñido a mano",
    season: "Primavera-verano",
    materials: "Chifón, tul plisado, pigmentos textiles",
    imageUrl: "/dresses/nebula.svg",
    model3dUrl: null,
    arEffectType: AREffectType.particles,
    arEffectAssetUrl: null,
    arEffectIntensity: 0.6,
    story:
      "Inspirado en fotografías del telescopio Hubble, Nébula fue teñido a mano capa por capa para lograr una transición de color que nunca se repite igual dos veces.",
  },
  {
    name: "Ícaro",
    description:
      "Prenda estructural con hombreras aladas y textura metálica, dedicada al vuelo y la caída.",
    designer: "Samuel Ortega",
    collection: "Mitos Modernos",
    category: "Traje conceptual",
    color: "Bronce",
    style: "Conceptual y escultural, con hombreras aladas",
    season: "Otoño-invierno",
    materials: "Cuero vegano, malla metálica, plumas sintéticas",
    imageUrl: "/dresses/icaro.svg",
    model3dUrl: null,
    arEffectType: AREffectType.model_3d,
    arEffectAssetUrl: null,
    arEffectIntensity: 0.5,
    story:
      "Ícaro reinterpreta el mito griego como una advertencia sobre la ambición creativa: las alas se despliegan con cada paso, pero están hechas para no sostener el vuelo por siempre.",
  },
  {
    name: "Medusa",
    description:
      "Vestido sirena con textura escamada y accesorios que simulan movimiento acuático.",
    designer: "Samuel Ortega",
    collection: "Mitos Modernos",
    category: "Vestido de gala",
    color: "Verde esmeralda",
    style: "Orgánico y marino, con volumen ondulante",
    season: "Verano",
    materials: "Lentejuelas recicladas, malla elástica, tul rígido",
    imageUrl: "/dresses/medusa.svg",
    model3dUrl: null,
    arEffectType: AREffectType.floating_text,
    arEffectAssetUrl: null,
    arEffectIntensity: 0.6,
    story:
      "Medusa celebra la fuerza femenina detrás de un mito históricamente narrado como maldición. Cada escama fue cosida a mano durante seis semanas.",
  },
  {
    name: "Solsticio",
    description:
      "Vestido minimalista de líneas puras que representa el equilibrio entre luz y sombra del solsticio.",
    designer: "Mateo Londoño",
    collection: "Amanecer Eterno",
    category: "Vestido de coctel",
    color: "Blanco hueso",
    style: "Fresco y luminoso, de corte coctel",
    season: "Verano",
    materials: "Lino, algodón orgánico, hilo de lino encerado",
    imageUrl: "/dresses/solsticio.svg",
    model3dUrl: null,
    arEffectType: AREffectType.frame,
    arEffectAssetUrl: null,
    arEffectIntensity: 0.4,
    story:
      "Solsticio busca la simplicidad como forma de lujo. Sin adornos superfluos, la prenda deja que la luz y el cuerpo hagan el trabajo visual.",
  },
];

async function main() {
  console.log("Seeding database...");
  await prisma.dress.deleteMany();
  for (const dress of dresses) {
    await prisma.dress.create({ data: dress });
  }
  console.log(`Seeded ${dresses.length} dresses.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
