# Fashion-IA | Fashion AR Runway

> **Guía de presentación y referencia del proyecto**  
> Documento preparado para leerse en Markdown y exportarse a PDF. Los diagramas usan Mermaid.

## 1. Resumen ejecutivo

Fashion-IA es un prototipo para acercar al público a los diseños de una colección de moda mediante una experiencia web. El módulo priorizado es el **chatbot**, que permite preguntar por prendas y responde con información respaldada por el catálogo disponible. En la fase 3 se agregó un **Home con cámara simulada** conectado al chat, un chat rediseñado con respuesta en vivo y un catálogo con colores, estilo y temporada.

El chatbot funciona hoy con un catálogo de prueba y una interfaz web propia (Home simulado y chat). El backend también contempla consultar los vestidos guardados en PostgreSQL. Gemini es opcional: puede ayudar a redactar respuestas, pero no es la fuente de los datos ni decide qué información es válida.

### Idea central

**Preguntar sobre una prenda → identificar el dato en el catálogo → responder con información trazable y sin inventar atributos.**

## 2. Equipo y responsabilidades

### Fase 1 — MVP del chatbot

| Responsabilidad | Integrante |
|---|---|
| Product Manager (PM) | **Michael Zuleta** |
| Backend | **Dario Borja** |
| Frontend | **Juan Henao** |

### Fase 3 — Home simulado, chat rediseñado y respuesta en vivo

| Responsabilidad | Integrante |
|---|---|
| Product Manager (PM) | **Miguel Ángel Muñoz Sosa**: lista de actividades, división de responsabilidades y autor del mockup actualizado de la interfaz |
| Backend | **Brayan Rojas**: catálogo con colores, estilo y temporada, y endpoint de respuesta en vivo |
| Frontend | **Wudeison Tovar**: Home con cámara simulada, botón flotante y chat rediseñado |

Los tres integrantes se incorporaron el 22 de octubre de 2026 con una sesión de
**2 horas** de socialización del proyecto. El trabajo de la fase 2 se registra
en el [informe de progreso](./informe-progreso.md).

## 3. Alcance del producto y estado actual

El repositorio reúne el prototipo Fashion AR y el módulo conversacional. **El frontend actual tiene dos pantallas conectadas: el Home con cámara simulada (`/`) y el chat (`/chat`)**. En el código también existen pantallas y componentes de pasarela con cámara real, escaneo y detalle del vestido (`/runway`, `/dresses/:id`), que aún no se enlazan desde el Home; el reconocimiento visual real sigue pendiente.

| Capacidad | Estado |
|---|---|
| Home con cámara simulada, botón flotante y tarjeta de prenda detectada | Implementado (simulación; no usa la cámara real) |
| Interfaz web para conversar con el chatbot (rediseñada) | Implementada |
| Respuesta en vivo (streaming) y sugerencias para seguir explorando | Implementadas |
| Catálogo con materiales, colores, estilo y temporada | Implementado en mock y en PostgreSQL (requiere la migración) |
| API `POST /api/v1/chat` | Implementada |
| Catálogo ficticio para demo, sin base de datos | Implementado y usado por defecto |
| Consulta de prendas desde PostgreSQL | Implementada como fuente opcional; requiere configurar y cargar la base de datos |
| Gemini para reformular respuestas con datos ya verificados | Opcional; necesita configuración y una clave válida |
| Respuestas deterministas cuando Gemini no se usa o falla | Implementadas |
| Lectura de un documento externo como fuente de conocimiento | Pendiente |
| Sesiones e historial conversacional persistente | Pendiente; `sessionId` se valida, pero no se almacena ni se usa para memoria |
| Simulación de prenda detectada → chat con esa prenda como contexto | Implementada |
| Flujo con cámara real y reconocimiento visual → chatbot contextual | Pendiente |

## 4. Flujo de uso del chatbot

0. Desde el Home, la persona abre el chat con el botón flotante (sin contexto) o con "Ver más información…" sobre una prenda detectada en la simulación (con esa prenda como contexto).
1. La persona escribe una pregunta o toca una sugerencia.
2. El frontend la envía como JSON a `POST /api/v1/chat/stream`.
3. El backend valida la solicitud y carga el catálogo configurado.
4. El manejador busca una prenda y el dato solicitado.
5. Si hay evidencia, construye respuesta, prenda y fuentes. Si no la hay, informa `no_evidence`; si la pregunta no corresponde al catálogo, informa `out_of_scope`.
6. Gemini puede mejorar la redacción cuando está configurado. Si falla, se conserva la respuesta determinista.
7. El frontend muestra la respuesta mientras llega y, al terminar, la ficha de la prenda, la fuente y nuevas sugerencias para seguir explorando.

```mermaid
flowchart TD
    HOME[Home con cámara simulada] -->|botón flotante o Ver más información| UI
    U[Persona escribe una pregunta o toca una sugerencia] --> UI[Chat React]
    UI --> S[chatService: streamChatMessage]
    S --> P[Proxy de Vite /api]
    P --> API[Express: POST /api/v1/chat/stream]
    API --> V[Validar método, JSON, tamaño y pregunta]
    V --> C{Fuente del catálogo}
    C -->|mock| M[Fixtures de prueba]
    C -->|db| DB[PostgreSQL mediante Prisma]
    M --> H[Buscar prenda y campo]
    DB --> H
    H --> R{¿Hay evidencia?}
    R -->|Sí| A[Construir respuesta y fuentes]
    R -->|No| NE[no_evidence u out_of_scope]
    A --> G{Gemini configurado}
    G -->|Sí| GR[Redactar usando solo datos verificados]
    G -->|No o error| DET[Conservar respuesta determinista]
    GR --> OUT[Eventos SSE: meta, delta y done]
    DET --> OUT
    NE --> OUT
    OUT --> UI
```

## 5. Arquitectura

```mermaid
flowchart LR
    subgraph Frontend["Frontend — React + Vite"]
        HOMEP[Home con cámara simulada]
        CHAT[Chat con respuesta en vivo]
        SERVICE[Servicio HTTP del chat]
        AR[Componentes de cámara y pasarela existentes]
        HOMEP --> CHAT
        CHAT --> SERVICE
    end

    subgraph Backend["Backend — Node.js + Express"]
        ROUTE[Ruta versionada del chatbot y /stream]
        HANDLER[Lógica de catálogo y contrato]
        LOADER[Cargador de catálogo]
        WRITER[Redactor Gemini opcional]
        ROUTE --> HANDLER
        HANDLER --> LOADER
        HANDLER -. datos verificados .-> WRITER
    end

    MOCK[Fixtures JSON] --> LOADER
    PRISMA[Prisma ORM] --> PG[(PostgreSQL)]
    PG --> LOADER
    SERVICE -->|HTTP JSON + SSE /api/v1/chat/stream| ROUTE
    AR -. reconocimiento real pendiente .-> HOMEP
```

    Los diagramas Entidad-Relación, casos de uso y máquina de estados están
    reunidos en el documento [Diagramas del proyecto](./diagramas-proyecto.md).

    ### Componentes principales

| Componente | Responsabilidad |
|---|---|
| `frontend/src/App.tsx` | Rutas: `/` Home, `/chat` chat, `/runway` y `/dresses/:id` existentes |
| `frontend/src/pages/HomePage.tsx` | Home con cámara simulada, detección de prendas de demostración y botón flotante al chat |
| `frontend/src/pages/ChatPage.tsx` | Chat: respuesta en vivo, insignias, ficha de prenda, fuente y sugerencias |
| `frontend/src/features/chat/chatSuggestions.ts` | Sugerencias iniciales y de seguimiento, calculadas en el frontend |
| `frontend/src/services/chatService.ts` | Envía la pregunta (JSON o stream SSE) y procesa errores HTTP |
| `backend/src/routes/chatV1.routes.ts` | Endpoint, validación HTTP, límite de solicitudes y formato de errores |
| `backend/src/chatbot/handler.ts` | Identifica prendas/campos y produce respuestas deterministas |
| `backend/src/chatbot/catalog.ts` | Carga los fixtures o adapta registros de PostgreSQL al contrato |
| `backend/src/chatbot/aiAnswer.ts` | Integración opcional con Gemini y fallback determinista |
| `backend/src/chatbot/stream.ts` | Respuesta en vivo con Gemini sobre el catálogo completo, con fallback determinista |
| `backend/prisma/schema.prisma` | Modelo de datos de las prendas |
| `frontend/src/pages/` y `frontend/src/features/` | Vistas y componentes de pasarela, cámara, AR, vestidos y chat contextual disponibles en el repositorio |

## 6. Tecnologías y función

| Tecnología | Uso en el proyecto |
|---|---|
| React y TypeScript | Componentes e interfaz web con tipos para solicitudes y respuestas |
| Vite | Servidor de desarrollo, compilación y proxy `/api` hacia el backend |
| CSS y Tailwind CSS | Presentación visual; la pantalla conversacional actual combina estilos propios con utilidades en las vistas existentes |
| Node.js y Express | API REST y procesamiento de solicitudes |
| Prisma y PostgreSQL | Modelo y acceso a vestidos cuando se selecciona la fuente `db` |
| Gemini (`@google/genai`) | Redacción opcional condicionada a los datos que entrega el catálogo |
| MediaDevices API | Acceso a cámara en los componentes de la pasarela; requiere permiso y contexto seguro |
| Three.js, Canvas/CSS y PWA/Workbox | Dependencias y soporte para visualización/instalación web; no equivalen por sí solos a reconocimiento visual real |
| Jest y Supertest / Vitest | Pruebas del backend HTTP y del frontend |

**Nota sobre AR:** la cámara del navegador entrega video con permiso del usuario. El reconocimiento que describe el MVP es simulado; no se debe presentar como un modelo de visión artificial ya entrenado o conectado.

## 7. Alcances del chatbot hoy

### Puede hacer

- Responder preguntas de catálogo sobre materiales, colores, estilo, temporada, creador e inspiración.
- Con Gemini activo, responder preguntas abiertas sobre el catálogo ("¿qué me recomiendas para el verano?", "¿qué prendas son verdes?") usando solo sus datos.
- Escribir la respuesta en vivo y proponer qué explorar después.
- Encontrar una prenda mediante su nombre completo, nombre sin tipo o alias no ambiguo.
- Responder preguntas generales sobre una prenda identificada usando los campos disponibles.
- Informar cuando falta un dato (`no_evidence`) o la consulta es ajena al catálogo (`out_of_scope`).
- Indicar qué registro/documento y campos respaldan la respuesta mediante `sources`.
- Usar reglas deterministas sin depender de una API externa.
- Usar Gemini opcionalmente para redactar, sin delegarle la selección de la fuente ni la veracidad de los campos.

### Todavía no hace

- Leer automáticamente PDF, Word, páginas web u otros documentos de referencia.
- Responder de forma fiable sobre datos que no estén en el catálogo conectado.
- Reconocer una prenda real a partir de una imagen o video; la detección del Home es una simulación con prendas de demostración.
- Responder preguntas abiertas sin Gemini: las reglas deterministas cubren una prenda y un campo por pregunta.
- Mantener memoria entre mensajes o usuarios; el historial visible es local a la interfaz.
- Resolver preguntas generales ajenas a las prendas.
- Identificar páginas o párrafos de una fuente documental externa; `sources` identifica el registro y los campos usados.

## 8. Contrato de la API

**Rutas:** `POST /api/v1/chat` (respuesta JSON) y `POST /api/v1/chat/stream` (la misma solicitud, respuesta en vivo como eventos SSE `meta`, `delta` y `done`)  
**Contenido:** `application/json`

### Solicitud

```json
{
  "question": "¿De qué materiales está hecho el Vestido Aurora de Jardín?"
}
```

`question` es obligatorio y acepta entre 1 y 500 caracteres. `sessionId` es opcional y debe tener formato UUID; actualmente solo se valida.

### Respuesta de negocio

```json
{
  "requestId": "req_0001",
  "status": "answered",
  "answer": "El Vestido Aurora de Jardín está confeccionado con los materiales del catálogo.",
  "garment": {
    "id": "VST-001",
    "name": "Vestido Aurora de Jardín",
    "type": "vestido",
    "creator": "Nombre del creador",
    "materials": ["material registrado"],
    "inspiration": "Inspiración registrada",
    "colors": ["color registrado"],
    "style": "Estilo registrado",
    "season": "Temporada registrada"
  },
  "sources": [
    {
      "recordId": "VST-001",
      "document": "catalogo-mock.json",
      "fields": ["materials"]
    }
  ],
  "meta": { "contractVersion": "0.1", "mock": true }
}
```

Estados de negocio: `answered`, `no_evidence`, `out_of_scope`. Los errores HTTP incluyen `VALIDATION_ERROR`, `UNSUPPORTED_MEDIA_TYPE`, `METHOD_NOT_ALLOWED`, `RATE_LIMITED` o `UPSTREAM_UNAVAILABLE`, junto con `requestId`.

`meta.mock` informa si la fuente de datos es ficticia; **no indica si se utilizó Gemini**.

## 9. Fuentes de información: ahora y siguiente etapa

### Hoy

- **Mock:** `backend/src/chatbot/fixtures/catalogo-mock.json`. Es la opción predeterminada de la demo; no necesita PostgreSQL.
- **Base de datos:** al configurar `CHATBOT_SOURCE=db`, el cargador consulta los vestidos de PostgreSQL. Convierte `designer` en `creator`, separa `materials` y usa `story` como `inspiration`.
- **Documento de referencia:** aún no está conectado al chatbot. Los fixtures y los registros estructurados no son una ingesta de documentos.

### Cuando se conecte el documento de referencia y los datos reales

La fuente aprobada debería convertirse en conocimiento consultable, no en texto libre que Gemini pueda completar por su cuenta:

1. Acordar el documento oficial y validar nombres, materiales, autoría e inspiración con el equipo.
2. Extraer y normalizar los datos por vestido; conservar identificadores y procedencia.
3. Para campos estructurados, cargar la información a PostgreSQL y usar el cargador `db` existente.
4. Si hay contenido narrativo no estructurado, incorporar ingesta y recuperación documental (por ejemplo, fragmentos indexados con referencia al documento y ubicación).
5. Recuperar únicamente fragmentos pertinentes para cada pregunta y pasarlos como contexto al generador.
6. Devolver referencias verificables —vestido, documento y campo o sección— y responder `no_evidence` si la fuente no respalda la respuesta.
7. Probar la cobertura, actualización, ambigüedades y respuestas sin evidencia antes de cambiar el modo de la demo.

```mermaid
flowchart LR
    DOC[Documento oficial validado] --> ING[Extracción y normalización]
    ING --> STRUCT[Campos del vestido]
    STRUCT --> DB[(PostgreSQL)]
    ING --> INDEX[Índice documental y referencias]
    Q[Pregunta] --> RET[Recuperar datos/fragmentos pertinentes]
    DB --> RET
    INDEX --> RET
    RET --> CHECK{¿Hay evidencia suficiente?}
    CHECK -->|Sí| GEN[Respuesta basada solo en la evidencia]
    CHECK -->|No| NONE[no_evidence]
    GEN --> CIT[Respuesta con referencias trazables]
```

**Resultado esperado de esa etapa:** respuestas sobre vestidos reales y la información aprobada, mejor trazabilidad hacia la fuente, y menos riesgo de atribuir datos incorrectos. La conexión a un documento no garantiza por sí sola respuestas correctas: se requieren extracción validada, recuperación pertinente y pruebas.

## 10. Ejecución para una demo local

Abrir dos terminales en la carpeta del proyecto (`fashion-IA-develop`).

**Backend**

```powershell
cd backend
npm install
npm run dev
```

**Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Abrir la URL local que indique Vite. El frontend usa el proxy `/api` para enviar las preguntas al backend en `http://localhost:3000`. Con la fuente `mock` no se necesita base de datos. No incluir claves de Gemini en documentos, capturas o repositorios.

Para comprobar el endpoint:

```powershell
$body = @{ question = "¿De qué materiales está hecho el Vestido Aurora de Jardín?" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/v1/chat -Method Post -ContentType "application/json" -Body $body
```

La cámara, si se presenta desde un celular, requiere HTTPS o `localhost` y permiso del navegador. La demo del chatbot no requiere activar la cámara.

## 11. Puntos a tener en cuenta

1. **Problema:** en una pasarela, la persona ve una prenda pero no siempre conoce sus materiales, creador o inspiración.
2. **Propuesta:** un chatbot consulta una fuente definida y explica los datos disponibles.
3. **Demostración:** preguntar por los materiales del *Vestido Aurora de Jardín*; mostrar respuesta, ficha y campos de fuente.
4. **Confiabilidad:** mostrar qué ocurre con una pregunta fuera del catálogo o un campo ausente; el sistema no debería inventar evidencia.
5. **Arquitectura:** explicar la interfaz, API, cargador mock/DB y Gemini opcional.
6. **Siguiente etapa:** conectar la información oficial de prendas, validar referencias y después integrar la prenda detectada por la experiencia AR.

### Mensaje de cierre

**El valor del módulo no es solo conversar: es responder sobre moda a partir de información controlada y dejar preparada la transición de datos de demostración a datos reales y verificables.**

## 12. Pruebas y documentación técnica

Tras la fase 2 se aprobaron **58 pruebas backend en 8 suites** y **29 pruebas frontend en 8 archivos**. La validación de la fase 1 había sido de 48 y 12 pruebas.

- [Informe de progreso con métricas y tareas](./informe-progreso.md)
- [Diagramas del proyecto](./diagramas-proyecto.md)
- [Contrato del chatbot](../backend/docs/chatbot-contract-v0.1.md)
- [Documentación del backend del chatbot](../backend/docs/chatbot-backend-pm.md)
- [README e instalación general](../README.md)
