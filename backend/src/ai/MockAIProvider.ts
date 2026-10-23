import type { AIProvider } from "./AIProvider";
import type { DressContext } from "../types/chat";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const KEYWORD_RULES: Array<{ keywords: string[]; build: (ctx: DressContext) => string | null }> = [
  {
    keywords: ["material", "tela", "hecho de", "confeccionado"],
    build: (ctx) =>
      ctx.materials
        ? `Este diseño utiliza ${ctx.materials}. Es una de las decisiones clave del diseñador para lograr el efecto visual que ves en la pasarela.`
        : null,
  },
  {
    keywords: ["disenador", "diseñador", "quien lo hizo", "quien diseno", "autor"],
    build: (ctx) => (ctx.designer ? `Este vestido fue diseñado por ${ctx.designer}.` : null),
  },
  {
    keywords: ["coleccion", "colección"],
    build: (ctx) =>
      ctx.collection ? `"${ctx.name}" pertenece a la colección "${ctx.collection}".` : null,
  },
  {
    keywords: ["color"],
    build: (ctx) => (ctx.color ? `El color principal de esta pieza es ${ctx.color}.` : null),
  },
  {
    keywords: ["categoria", "categoría", "tipo de prenda", "que tipo"],
    build: (ctx) => (ctx.category ? `Se clasifica como ${ctx.category}.` : null),
  },
  {
    keywords: ["historia", "concepto", "inspiracion", "inspiración", "por que", "porque", "significado"],
    build: (ctx) => (ctx.story ? ctx.story : null),
  },
  {
    keywords: ["describe", "descripcion", "descripción", "que es", "cuentame"],
    build: (ctx) => (ctx.description ? ctx.description : null),
  },
];

export class MockAIProvider implements AIProvider {
  async chat(message: string, context: DressContext): Promise<string> {
    const normalizedMessage = normalize(message);

    for (const rule of KEYWORD_RULES) {
      const matches = rule.keywords.some((keyword) => normalizedMessage.includes(normalize(keyword)));
      if (matches) {
        const answer = rule.build(context);
        if (answer) return answer;
      }
    }

    const fallbackParts = [
      `"${context.name}" es una pieza`,
      context.designer ? `diseñada por ${context.designer}` : null,
      context.collection ? `de la colección "${context.collection}"` : null,
    ].filter(Boolean);

    const intro = fallbackParts.join(" ") + ".";
    const extra = context.description ?? context.story ?? "";

    return `${intro} ${extra} Puedes preguntarme sobre sus materiales, el diseñador, la colección o la historia detrás de la prenda.`.trim();
  }
}
