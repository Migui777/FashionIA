# Contrato del chatbot para frontend (API v0.1)

Contrato para integrar el frontend con el chatbot del backend. El endpoint v1 puede usar el catálogo mock o PostgreSQL, y opcionalmente Gemini para redactar respuestas. `meta.mock` indica la fuente de datos, no si se usó IA.

Este endpoint convive con el endpoint legado `POST /api/chat`, que acepta `{ dressId, message }` y responde `{ message }`. No mezclar los dos formatos: el contrato documentado aquí corresponde a `POST /api/v1/chat`.

## Uso

```bash
cd backend
npm install
npm run dev          # http://localhost:3000  ->  POST /api/v1/chat
npm test             # incluye chatbot.handler.test.ts y chatbot.api.test.ts
RATE_LIMIT_PER_MINUTE=20   # variable opcional en backend/.env
```

Con `CHATBOT_SOURCE=mock` no necesita base de datos. Para usar los mismos vestidos que muestra la página de detalle del frontend, configura `CHATBOT_SOURCE=db` y prepara PostgreSQL.

## Contrato HTTP

### Solicitud

`POST /api/v1/chat` con `Content-Type: application/json`.

```json
{
  "question": "Háblame del Vestido Aurora de Jardín",
  "sessionId": "3f1c2b7e-9a41-4c1e-8d52-6a0b1f7e2c10"
}
```

`question` es obligatorio, debe ser texto de 1 a 500 caracteres. `sessionId` es opcional y, si se envía, debe ser UUID. Para preguntas hechas desde el detalle de una prenda, incluir su nombre en `question`: v1 no recibe `dressId`.

### Respuesta correcta

Las respuestas de negocio usan HTTP 200. `status` puede ser `answered`, `no_evidence` o `out_of_scope`.

```json
{
  "requestId": "req_0001",
  "status": "answered",
  "answer": "El Vestido Aurora de Jardín se inspira en jardines al amanecer.",
  "garment": {
    "id": "VST-001",
    "name": "Vestido Aurora de Jardín",
    "type": "vestido",
    "creator": "Elena Mar de Luz",
    "materials": ["algodón orgánico", "tul de poliéster reciclado"],
    "inspiration": "Jardines al amanecer y el movimiento de las flores con la brisa"
  },
  "sources": [
    {
      "recordId": "VST-001",
      "document": "catalogo-mock.json",
      "fields": ["name", "inspiration"]
    }
  ],
  "meta": { "contractVersion": "0.1", "mock": true }
}
```

`garment` puede ser `null` si no se identifica una prenda. `sources` puede estar vacío; cada `fields` enumera los campos disponibles que respaldan la respuesta. En una respuesta libre, el backend filtra los campos desconocidos, duplicados o ausentes de la prenda.

### Errores HTTP

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo question es obligatorio y debe tener entre 1 y 500 caracteres.",
    "requestId": "req_0001"
  }
}
```

| HTTP | `error.code` | Significado |
|---|---|---|
| 400 | `VALIDATION_ERROR` | JSON válido requerido; `question` inválida o `sessionId` no UUID |
| 405 | `METHOD_NOT_ALLOWED` | En esta ruta solo se acepta POST |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | El contenido debe ser JSON |
| 429 | `RATE_LIMITED` | Se superó el límite; revisar `Retry-After` |
| 503 | `UPSTREAM_UNAVAILABLE` | No se pudo consultar la fuente de datos |

El frontend debe tratar `status` como resultado conversacional y los códigos HTTP como errores de transporte/solicitud. En errores HTTP se devuelve el objeto `{ error: { code, message, requestId } }`.

## Fuente de datos (`CHATBOT_SOURCE`)

| Valor | Fuente | `meta.mock` |
|---|---|---|
| `mock` (por defecto) | `src/chatbot/fixtures/catalogo-mock.json` | `true` |
| `db` | Vestidos de PostgreSQL (los del `seed`), consultados en cada solicitud | `false` |

Con `db`: `designer` → `creator`, `materials` (texto separado por comas) → lista, `story` → `inspiration`, y `garment.id` / `sources[].recordId` es el `id` del vestido en la base de datos. El nombre se arma con el tipo ("Vestido Aurora", "Traje Ícaro"). Si la consulta falla, responde 503 `UPSTREAM_UNAVAILABLE`. Requiere haber corrido `npx prisma migrate dev` y `npx prisma db seed`.

## Escenarios

| Escenario | Pregunta de ejemplo | Resultado |
|---|---|---|
| Respuesta encontrada | `¿De qué materiales está hecho el Vestido Aurora de Jardín?` | 200, `answered`, con `garment` y `sources` |
| Pregunta abierta | `Háblame del Vestido Aurora de Jardín` | 200, `answered`, con resumen y campos de fuente validados |
| Campo no disponible | `¿En qué se inspira el Vestido Marea Serena?` | 200, `no_evidence`, con `garment` y `fields: []` |
| Prenda inexistente | `¿De qué está hecho el Vestido Estrella?` | 200, `no_evidence`, `garment: null` |
| Fuera de alcance | `¿Qué clima hace hoy?` | 200, `out_of_scope`, respuesta fija |
| Error simulado | `__simular_error__` | 503, `UPSTREAM_UNAVAILABLE` |
| Validación | pregunta vacía, o de más de 500 caracteres | 400, `VALIDATION_ERROR` |

```bash
curl -s -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"¿De qué materiales está hecho el Vestido Aurora de Jardín?"}'
```

## Reglas del mock

- Los datos están en `backend/src/chatbot/fixtures/catalogo-mock.json` (6 prendas ficticias). Para añadir escenarios basta editar ese archivo.
- La detección de prenda y de campo es por texto, sin acentos ni mayúsculas. Una prenda se reconoce por su nombre completo, sin el tipo ("Aurora de Jardín") o por su primera palabra ("Aurora") si ninguna otra prenda la comparte. Si la pregunta nombra dos prendas se usa la primera.
- Si se nombra una prenda sin pedir un campo, el handler produce un resumen fijo con `fields: ["name", "type"]`; si el redactor libre está disponible, puede reemplazarlo y declarar los campos usados, validados contra la prenda.
- Dentro del backend: `GET /health` (ya existía), 404 para rutas desconocidas, 405 para métodos distintos de POST en `/api/v1/chat`, y límite de solicitudes en memoria por IP (`RATE_LIMIT_PER_MINUTE`, por defecto 20). El CORS lo define `CORS_ORIGIN` del backend, ya no es abierto.
- Los errores de este endpoint usan `{ error: { code, message, requestId } }`; el resto de la API conserva su formato `{ error: "mensaje" }`.
- Un cambio de campos, estados o códigos de error sube `CONTRACT_VERSION` en `src/chatbot/contract.ts` y se comunica a Juan antes de integrarlo.

## Estructura

```
backend/src/chatbot/contract.ts    constantes y tipos del contrato (CONTRACT_VERSION aquí)
backend/src/chatbot/handler.ts     lógica del contrato (función pura, sin Express)
backend/src/chatbot/catalog.ts     carga de la fuente (hoy, los fixtures)
backend/src/chatbot/fixtures/      datos ficticios
backend/src/routes/chatV1.routes.ts  ruta, límite de solicitudes y errores del contrato
backend/src/__tests__/chatbot.*.test.ts
```

## Redacción con Gemini (opcional)

Con `AI_PROVIDER=gemini` y `GEMINI_API_KEY`, las preguntas de un campo concreto (`materials`, `creator` o `inspiration`) usan el redactor de campo. Las preguntas abiertas sobre una prenda usan el redactor libre, que recibe solo la pregunta y los datos de esa prenda; puede responder `answerable: false` para producir `no_evidence`. No se invoca Gemini para `out_of_scope`, prendas no identificadas ni errores de validación.

El JSON de éxito no cambia según el redactor. Si Gemini falla, excede 8 s, devuelve una respuesta vacía/inválida o no aporta ningún campo verificable, se conserva el resumen determinista. `meta.mock: true` significa que se usó el catálogo ficticio; no indica si Gemini estuvo activo.
