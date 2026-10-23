# Documentación del backend del chatbot (PM)

## 1) Objetivo

El chatbot del backend forma parte del MVP de Fashion AR y está pensado para responder preguntas sobre los vestidos y trajes del catálogo de la app. Su propósito es ayudar al usuario a conocer propiedades clave de una prenda, como materiales, creador e inspiración, sin requerir que el frontend haga lógica de negocio ni de enrutado.

La implementación actual está preparada para:

- responder en un mismo contrato para frontend y tests,
- usar un catálogo mock por defecto,
- conectar con la base de datos cuando se habilita `CHATBOT_SOURCE=db`,
- usar Gemini como redactor opcional cuando la IA está activa,
- mantener un comportamiento determinista si no hay IA o si la IA falla.

## 2) Alcance actual

### Casos que cubre

- Búsqueda de una prenda por nombre o alias.
- Detección del campo que el usuario pregunta (`materials`, `creator`, `inspiration`).
- Respuesta directa cuando existe evidencia en la fuente.
- Respuesta de “no evidence” cuando la prenda existe pero el dato no está disponible.
- Respuesta “out of scope” para preguntas ajenas al catálogo.
- Validación de entrada y límites de seguridad.

### Fuentes de datos

Actualmente el backend soporta dos modos:

| Modo | Fuente | Estado |
|---|---|---|
| `mock` | `backend/src/chatbot/fixtures/catalogo-mock.json` | Por defecto |
| `db` | Base de datos PostgreSQL con los vestidos del seed | Opcional |

La clave `meta.mock` se usa para indicar si la respuesta viene de datos ficticios; no significa que la IA se haya usado o no.

## 3) Endpoint principal

### Ruta

`POST /api/v1/chat`

### Objetivo

Recibir la pregunta del usuario y devolver una respuesta con estructura consistente para el frontend.

### Ejemplo de request

```json
{
  "question": "¿De qué materiales está hecho el Vestido Aurora de Jardín?",
  "sessionId": "3f1c2b7e-9a41-4c1e-8d52-6a0b1f7e2c10"
}
```

### Ejemplo de response exitosa

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

## 4) Estados de respuesta

El backend devuelve siempre un `status` de negocio con uno de estos valores:

- `answered`: hay una respuesta útil y respaldada por la prenda.
- `no_evidence`: la prenda existe pero no hay dato suficiente para contestar ese campo.
- `out_of_scope`: la pregunta no está relacionada con el catálogo.

Esto permite al frontend manejar la respuesta de manera semántica, sin depender solo del código HTTP.

## 5) Validación y errores

### Validaciones

- `question` es obligatorio.
- Debe tener entre 1 y 500 caracteres.
- Si se envía `sessionId`, debe ser un UUID válido.
- El request debe enviar JSON válido.
- El content-type debe ser `application/json`.
- El endpoint solo acepta `POST`.

### Códigos de error del contrato

| HTTP | Código | Significado |
|---|---|---|
| 400 | `VALIDATION_ERROR` | request mal formado o invalidado |
| 405 | `METHOD_NOT_ALLOWED` | se usa un método distinto a POST |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Content-Type incorrecto |
| 429 | `RATE_LIMITED` | demasiadas peticiones por IP |
| 503 | `UPSTREAM_UNAVAILABLE` | fallo de fuente de datos / IA |

La forma del error es estricta:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo question es obligatorio y debe tener entre 1 y 500 caracteres.",
    "requestId": "req_0001"
  }
}
```

## 6) Lógica de negocio del chatbot

La lógica principal vive en:

- `backend/src/chatbot/handler.ts`
- `backend/src/chatbot/contract.ts`
- `backend/src/chatbot/catalog.ts`

### Flujo principal

1. Se valida el JSON de entrada.
2. Se detecta si la pregunta está relacionada con el catálogo.
3. Se busca la prenda más probable por nombre o alias.
4. Se detecta el campo consultado (`materials`, `creator` o `inspiration`).
5. Si no existe la prenda o no hay evidencia, se devuelve `no_evidence` o `out_of_scope`.
6. Si hay respuesta, se construye el objeto con `garment`, `sources` y `meta`.

### Regla de detección de prenda

La lógica normaliza texto eliminando acentos y mayúsculas, y busca coincidencias con:

- nombre completo,
- nombre sin el tipo (`Aurora de Jardín`),
- primera palabra clave si no se repite en otras prendas.

Si la pregunta menciona varias prendas, se toma la primera que aparece.

### Regla de detección de campo

Se busca primero la palabra clave más temprana dentro de la pregunta, por ejemplo:

- `material`, `tela`, `hecho`, `confección` → `materials`
- `creador`, `diseñador`, `autor`, `quién` → `creator`
- `inspir` → `inspiration`

## 7) Fuente de datos y catálogo

### Modo mock

El mock actual está en `backend/src/chatbot/fixtures/catalogo-mock.json` y contiene un catálogo con varios vestidos ficticios. Este modo es el recomendado para desarrollo y demos porque no requiere base de datos ni API keys.

### Modo DB

Cuando `CHATBOT_SOURCE=db`, el catálogo se carga desde PostgreSQL usando el repositorio de vestidos.

Se hace una conversión del modelo de la app a la estructura del contrato del chatbot:

- `designer` → `creator`
- `materials` en texto → array de materiales
- `story` → `inspiration`
- `name` se completa con el tipo (`Vestido ...`, `Traje ...`)

Esto garantiza una capa de compatibilidad entre el dominio real de la aplicación y el contrato del chatbot.

## 8) Integración con Gemini (opcional)

La IA no decide el contrato ni la fuente de verdad. Su papel es redactar la respuesta final en lenguaje natural, manteniendo la lógica de negocio en el backend.

### Condiciones para activarse

- `AI_PROVIDER=gemini`
- exista `GEMINI_API_KEY`

### Casos donde se usa

- preguntas concretas sobre `materials`, `creator` o `inspiration`
- preguntas abiertas sobre una prenda detectada

### Comportamiento de fallback

Si Gemini falla, tarda demasiado, devuelve respuesta vacía o inválida, o la respuesta no aporta campos verificables, el backend conserva la respuesta determinista original.

Esto asegura que:

- la UX no se rompe,
- el comportamiento queda consistente,
- se evita inventar información.

## 9) Seguridad y operación

### Rate limiting

Se aplica un límite en memoria por IP en `/api/v1/chat`:

- valor por defecto: `20` peticiones/minuto
- configurable con `RATE_LIMIT_PER_MINUTE`

### CORS

El backend restringe origen con `CORS_ORIGIN` y por defecto usa `http://localhost:5173`.

### Cuerpo del request y tamaño

- límite de `10kb` por request
- parser JSON específico para este contrato
- errores de parseo gestionados con el formato propio del endpoint

### Arquitectura de seguridad actual

- el servicio está pensado para MVP,
- no hay autenticación ni autorización,
- el rate limit es local en memoria, no distribuido,
- no es una solución de producción multiinstancia.

## 10) Estructura del módulo chatbot

```text
backend/src/chatbot/
├── contract.ts
├── handler.ts
├── catalog.ts
├── aiAnswer.ts
├── fixtures/
│   └── catalogo-mock.json
└── ...
```

Los archivos más relevantes son:

- `contract.ts`: define tipos, validaciones y versionado del contrato
- `handler.ts`: lógica de detección e interpretación del request
- `catalog.ts`: carga mock o desde la base de datos
- `aiAnswer.ts`: integración con Gemini y fallback
- `routes/chatV1.routes.ts`: endpoint HTTP y manejo de errors del contrato

## 11) Consideraciones para PM

### Qué ya está resuelto

- El flujo de respuesta está definido y estable.
- Hay un contrato claro entre frontend y backend.
- La app tiene un modo mock para demos y pruebas.
- La IA es opcional y no bloquea el MVP.
- El comportamiento de validación y error es consistente.

### Qué hay que considerar como siguiente paso

- definir si se quiere usar este mismo catálogo para la versión real de producción,
- decidir si la IA se habilita solo en entorno de demo o también en producción,
- revisar el manejo de rate limiting en un entorno multiinstancia,
- evaluar si la respuesta del chatbot debe incluir más metadatos de contexto o trazabilidad,
- ampliar la cobertura del catálogo o introducir más campos de prenda.

## 12) Riesgos y límites actuales

- El chatbot usa heurísticas de texto para detectar prenda y campo; esto resulta útil para un catálogo pequeño, pero puede ser frágil con nombres ambiguos.
- El mock está pensado para demos, no como base de producción.
- El rate limiting es local y no escala horizontalmente.
- La respuesta de IA no sustituye la lógica de negocio; no debe ser la fuente de verdad.
- La API v1 convive con una ruta legacy, por lo que la integración debe evitar mezclar ambos contratos.

## 13) Resumen ejecutivo

El backend del chatbot ya tiene una base funcional sólida para un MVP: responde preguntas sobre prendas del catálogo, valida inputs, distingue entre respuesta útil, falta de evidencia y fuera de alcance, y puede operar con datos mock o con la base de datos real. La implementación es modular, está bien separada de Express y está preparada para soportar IA opcional sin romper la lógica principal.

Para el PM, la clave es que este módulo ya está en un estado de integración útil para demo y validación funcional, con una estructura clara para ir creciendo hacia una experiencia más rica y más robusta.
