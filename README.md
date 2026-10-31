# Fashion AR Runway

PWA de realidad aumentada para pasarelas de moda. El usuario apunta la cámara
de su celular hacia la pasarela, la app "detecta" un vestido (modo demo) y
muestra un efecto de AR junto con información del diseño; también puede
preguntarle a un chat sobre esa prenda.

> **Estado de esta entrega:** el módulo priorizado y la pantalla frontend actualmente conectada son el chatbot. El repositorio también contiene vistas y componentes de cámara/AR cuya integración completa con el chatbot está pendiente. Consulta la [guía de presentación del proyecto](docs/presentacion-proyecto.md) para ver el estado real, los flujos, el alcance actual y la siguiente etapa.

Proyecto universitario — MVP simple, sin autenticación, sin infraestructura
extra, con catálogo de prueba predeterminado y proveedores intercambiables.
El modo mock no necesita API keys; Gemini es opcional.

## Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- vite-plugin-pwa
- Workbox

**Cámara:**

- MediaDevices API
- `navigator.mediaDevices.getUserMedia()`

**Efectos de realidad aumentada** (preferiblemente tecnologías gratuitas):

- Three.js
- MediaPipe (cuando sea necesario)
- Canvas API
- CSS/WebGL
- Modelos GLTF/GLB gratuitos

No se utiliza ninguna plataforma WebAR de pago.

### Backend

- Node.js
- Express o NestJS (se prioriza Express si permite reducir complejidad)

El backend es una API REST sencilla: sin microservicios ni arquitectura
excesivamente compleja. Estructura:

```text
backend/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── database/
│   ├── types/
│   └── app.ts
├── package.json
└── tsconfig.json
```

### Base de datos

- PostgreSQL
- Prisma ORM (opcional)

Se mantiene un modelo de datos pequeño. Inicialmente la entidad principal es
`Dress`:

| Campo | Descripción |
|---|---|
| `id` | Identificador |
| `name` | Nombre del vestido |
| `description` | Descripción |
| `designer` | Diseñador |
| `collection` | Colección |
| `category` | Categoría |
| `color` | Color |
| `materials` | Materiales |
| `imageUrl` | URL de la imagen |
| `model3dUrl` | URL del modelo 3D (GLTF/GLB) |
| `arEffect` | Efecto de AR asociado |
| `story` | Historia detrás del diseño |
| `createdAt` | Fecha de creación |
| `updatedAt` | Fecha de última actualización |

No todos los campos son obligatorios.

### IA y reconocimiento

- **Chatbot v1:** `POST /api/v1/chat` usa el catálogo mock por defecto y
  respuestas deterministas. `CHATBOT_SOURCE=db` permite consultar los vestidos
  de PostgreSQL. Gemini es opcional y solo redacta respuestas a partir de los
  datos recuperados; si falla, se conserva la respuesta determinista. Consulta
  la [documentación del chatbot](backend/docs/chatbot-contract-v0.1.md).
- **Chat legado:** `POST /api/chat` conserva el proveedor `MockAIProvider` o,
  si se configura, `GeminiProvider` con fallback. Este endpoint no es el
  contrato v1 descrito arriba.
- **Reconocimiento del vestido:** `MockDressRecognitionService` (simula la
  detección tras unos segundos de cámara fija). La interfaz
  `DressRecognitionService` permite reemplazarlo después por MediaPipe,
  TensorFlow o un servicio externo sin tocar el resto de la app.

## Estructura

```text
Fashion-IA/
├── backend/     API REST (Express + Prisma + PostgreSQL)
└── frontend/    PWA (React + Vite + Tailwind)
```

## Requisitos

- Node.js 20.19+ (o 22.12+)
- npm

## Inicio rápido (chatbot)

El chatbot funciona con el catálogo de demostración. Para probarlo no necesitas
PostgreSQL, una API key ni configurar servicios externos.

1. Clona el repositorio y abre una terminal en la carpeta `fashion-IA-develop`.
2. Instala y configura el backend:

```bash
cd backend
npm install
```

```powershell
Copy-Item .env.example .env
```

En macOS/Linux, el comando equivalente para copiar la configuración es
`cp .env.example .env`. La configuración predeterminada usa datos de
demostración y no necesita cambios.

3. En esa terminal, inicia el backend:

```bash
npm run dev
```

4. Abre otra terminal en `fashion-IA-develop\frontend` e inicia el frontend:

```bash
npm install
```

```powershell
Copy-Item .env.example .env
```

En macOS/Linux: `cp .env.example .env`.

```bash
npm run dev
```

Abre en el navegador la dirección que muestra Vite, normalmente
`http://localhost:5173`. El backend escucha en `http://localhost:3000` y el
chatbot usa el catálogo mock por defecto.

## Activar el catálogo completo con PostgreSQL

PostgreSQL solo es necesario para las funciones que consultan los vestidos
guardados en la base de datos, como el catálogo y la demo AR. Para habilitarlo,
instala o usa una instancia de PostgreSQL y crea una base vacía llamada
`fashion_ar`:

```bash
createdb fashion_ar
```

También puedes crearla desde pgAdmin o SQL Shell. En `backend/.env`, agrega la
URL de conexión con tus credenciales:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/fashion_ar?schema=public"
CHATBOT_SOURCE=db
```

Luego, desde `backend/`, crea las tablas y carga los vestidos de ejemplo:

```bash
npx prisma migrate dev
npx prisma db seed
```

Para volver al modo sin base de datos, cambia `CHATBOT_SOURCE=mock`. La guía
de [demo en celular](#ver-la-app-desde-tu-celular-red-local) explica la
configuración adicional de cámara y acceso en red.

Las peticiones a `/api` se resuelven automáticamente contra el backend gracias
al proxy de Vite — no hace falta tocar `CORS_ORIGIN` ni `VITE_API_URL` al
cambiar de puerto.

### Ver la app desde tu celular (red local)

El servidor de Vite ya escucha en todas las interfaces (`server.host: true`
en `vite.config.ts`). Al correr `npm run dev` verás una o varias URLs
"Network" en la terminal, por ejemplo:

```text
➜  Network: http://192.168.1.23:5173/
```

Abre esa URL desde el navegador del celular, siempre que esté conectado a
la **misma red Wi-Fi** que tu computador. El backend no necesita
configuración adicional: el proxy de Vite reenvía `/api` internamente.

### ⚠️ La cámara necesita HTTPS (o localhost)

Por seguridad, los navegadores solo permiten `getUserMedia` (acceso a
cámara) en páginas servidas por `https://`, o por `http://localhost` en la
misma máquina. Una IP de red local por `http://` (como
`http://192.168.1.23:5173`) **no cumple esa condición**: la app cargará y
se podrá navegar en el celular, pero el botón "Activar cámara" fallará con
"no soportado" o "error".

Hay dos formas de resolverlo. La recomendada (certificado local) funciona
sin depender de internet ni de un servicio externo — ideal para el día de
la presentación. La alternativa (túnel) no requiere ninguna instalación
previa pero es menos estable.

## Certificado HTTPS local con mkcert (recomendado)

Se configura una sola vez por computador y por celular; después ya no
vuelves a tocar nada.

### 1. Instalar mkcert en tu PC

**Windows** (sin Chocolatey/Scoop — descarga el binario directo):

```bash
mkdir -p ~/bin
curl -sL -o ~/bin/mkcert.exe "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe"
```

(agrega `~/bin` a tu PATH, o simplemente llama al binario con su ruta
completa). Si tienes Chocolatey: `choco install mkcert`.

**macOS:** `brew install mkcert`
**Linux:** `sudo apt install mkcert` (o el paquete equivalente de tu distro)

### 2. Instalar la CA local y generar el certificado

```bash
mkcert -install
```

Averigua tu IP de red local:

- Windows: `ipconfig` (busca "Dirección IPv4" de tu adaptador Wi-Fi/Ethernet)
- macOS/Linux: `ifconfig` o `ip addr`

Genera el certificado dentro de `frontend/.certs/` (el nombre de archivo
importa, `vite.config.ts` ya lo busca ahí):

```bash
cd frontend
mkdir .certs
mkcert -key-file .certs/dev-key.pem -cert-file .certs/dev-cert.pem localhost 127.0.0.1 ::1 TU-IP-LOCAL
```

Reemplaza `TU-IP-LOCAL` por la IP real (ej. `192.168.1.23`). Vuelve a correr
este comando si tu IP cambia (por ejemplo, al conectarte a otra red).

A partir de aquí, `npm run dev` levanta el frontend en `https://` tanto en
`localhost` como en las URLs "Network" — no hay que tocar `vite.config.ts`,
ya detecta automáticamente si existen esos archivos.

### 3. Instalar el certificado raíz en tu celular

Necesitas pasarle el archivo `rootCA.pem` a tu celular. La forma más simple
sin cables ni cuentas es servirlo por HTTP plano un momento desde tu red
local:

```bash
cd "$(mkcert -CAROOT)"
node -e "require('http').createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/x-x509-ca-cert','Content-Disposition':'attachment; filename=rootCA.pem'});res.end(require('fs').readFileSync('rootCA.pem'))}).listen(8899,'0.0.0.0',()=>console.log('Descárgalo desde el celular en: http://TU-IP-LOCAL:8899/rootCA.pem'))"
```

(Ctrl+C para apagarlo una vez lo hayas descargado; también puedes mandarte
el archivo por AirDrop, correo o USB si lo prefieres).

#### En iPhone (iOS)

1. Abre en **Safari**: `http://TU-IP-LOCAL:8899/rootCA.pem`
2. Aparece un aviso de "perfil de configuración" → **Permitir**.
3. Ve a **Ajustes** → arriba, cerca de tu cuenta, aparece **"Perfil
   descargado"** → tócalo → **Instalar** (pide tu código) → **Instalar** de
   nuevo → **Listo**.
4. **Paso que mucha gente olvida:** ve a **Ajustes → General → Información
   → Ajustes de confianza de certificados**, y activa el interruptor junto
   al certificado "mkcert..." recién instalado. Sin este paso, iOS lo
   instala pero no confía en él para HTTPS.

#### En Android

1. Abre en **Chrome**: `http://TU-IP-LOCAL:8899/rootCA.pem` y descárgalo
   (Chrome puede avisar que el tipo de archivo es riesgoso; acepta, es tu
   propio certificado).
2. Ve a **Ajustes → Seguridad** (en algunos equipos: **Seguridad y
   privacidad → Más ajustes de seguridad**) → **Cifrado y credenciales** →
   **Instalar un certificado** → **Certificado de CA**.
3. Confirma pese a la advertencia de "no se recomienda" (es normal, Android
   avisa así para cualquier CA que no sea la del fabricante) y selecciona el
   archivo `rootCA.pem` descargado.
4. Si el equipo no tiene PIN/patrón de bloqueo configurado, Android puede
   pedirte que configures uno antes de permitir instalar un certificado CA.

> Los menús exactos varían un poco según la marca (Samsung, Xiaomi, Pixel,
> etc.) — el término a buscar en Ajustes es siempre "instalar certificado" o
> "credenciales".

### 4. Probar

```bash
# terminal 1
cd backend && npm run dev
# terminal 2
cd frontend && npm run dev
```

La terminal del frontend ahora muestra URLs `https://` (local y de red).
Abre la URL "Network" desde el celular — ya no debería salir ninguna
advertencia, y "Activar cámara" pedirá el permiso normalmente.

## Alternativa rápida: túnel HTTPS temporal

Si no quieres instalar nada (por ejemplo, para una prueba rápida en un
celular ajeno), puedes usar un túnel público en lugar del certificado
local:

```bash
npx localtunnel --port 5173
```

Esto imprime una URL pública `https://algo.loca.lt`. Ábrela desde el
celular — el navegador mostrará una advertencia de sitio no verificado la
primera vez (es el certificado del túnel, no un problema de la app);
acéptala y la cámara funcionará con normalidad.

Ten en cuenta: requiere internet en el momento de la demo, el servicio
gratuito de localtunnel se desconecta con cierta frecuencia (hay que
relanzarlo y la URL cambia cada vez), y muestra una pantalla intermedia
pidiendo confirmar la IP antes de continuar. Para una presentación
importante, el certificado local (arriba) es más confiable.

## Modo demo

Con `VITE_DEMO_MODE=true` (valor por defecto en `.env.example`), la app no
depende de ningún modelo de IA real ni de conexión a internet estable: tras
mantener la cámara enfocada unos segundos, el sistema "detecta" uno de los
vestidos sembrados en la base de datos, muestra su efecto AR y lo agrega al
carrusel de "Vestidos encontrados". Esto permite demostrar el flujo completo
sin cámara real avanzada ni servicios externos.

## Scripts útiles

Backend (`backend/`):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor en modo desarrollo |
| `npm test` | Tests con Jest + Supertest |
| `npx prisma studio` | Explorador visual de la base de datos |
| `npx prisma db seed` | Vuelve a cargar los 6 vestidos de ejemplo |

Frontend (`frontend/`):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests con Vitest + React Testing Library |
| `npm run build` | Build de producción (incluye el service worker PWA) |

## Chatbot de Modas (contrato API v0.1)

Además del chat por vestido (`POST /api/chat`), el backend expone el contrato
acordado con datos ficticios en `POST /api/v1/chat`. Detalles, escenarios y
ejemplos en [`backend/docs/chatbot-contract-v0.1.md`](backend/docs/chatbot-contract-v0.1.md).

## Chat con Gemini

Ambos endpoints de chat pueden usar Google Gemini. Configuración en
`backend/.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=tu_api_key        # https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash    # opcional
```

Luego `cd backend && npm install && npm run dev`. Nunca subas la key a git
(`.env` ya está en `.gitignore`).

- **`POST /api/chat`** (`{ dressId, message }`): `GeminiProvider` recibe los
  datos del vestido como instrucciones de sistema y responde en español solo
  con esa información. Si Gemini falla, responde `MockAIProvider`.
- **`POST /api/v1/chat`** (contrato v0.1): el handler determinista sigue
  decidiendo `status`, `garment` y `sources`. Gemini solo redacta el texto de
  `answer` cuando el estado es `answered` y se pidió un campo concreto
  (materiales, creador o inspiración). Si falla o tarda más de 8 s se conserva
  la respuesta determinista. Código en `backend/src/chatbot/aiAnswer.ts`.

- **`POST /api/v1/chat/stream`** (misma solicitud que `/api/v1/chat`): respuesta
  en vivo como eventos SSE (`meta`, `delta`, `done`). El chat de la app usa este
  endpoint. Con Gemini activo, el asistente responde preguntas abiertas
  ("¿qué me recomiendas para el verano?", "¿qué prendas son verdes?") usando solo
  el catálogo: prendas, materiales, colores, estilo, temporada, creador e
  inspiración. Si el catálogo no alcanza, o Gemini no está activo, responde con
  las reglas deterministas (que cubren una prenda y un campo por pregunta).
  Código en `backend/src/chatbot/stream.ts`.

Con `AI_PROVIDER=mock` (o sin `GEMINI_API_KEY`) todo funciona como antes, sin
llamadas externas. Los tests (`npm test`) nunca llaman a Gemini.

## Administración de vestidos

No hay panel administrativo en esta versión. Los vestidos se gestionan
directamente en PostgreSQL, con `npx prisma studio` (interfaz visual) o
editando `backend/prisma/seed.ts` y volviendo a correr el seed.

## Variables de entorno

Backend (`backend/.env`):

```env
PORT=3000
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/fashion_ar?schema=public
AI_PROVIDER=mock                 # mock | gemini
GEMINI_API_KEY=                  # solo si AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash    # opcional
CORS_ORIGIN=http://localhost:5173
```

`CORS_ORIGIN` solo importa si algo llama al backend directamente (sin pasar
por el proxy de Vite) — por ejemplo, pruebas con `curl` o Postman.

Frontend (`frontend/.env`):

```env
VITE_API_URL=/api
VITE_DEMO_MODE=true
```

`VITE_API_URL=/api` es una ruta relativa: el proxy de `vite.config.ts` la
reenvía a `http://localhost:3000` automáticamente, sin importar si accedes
desde `localhost`, tu IP de red local o un túnel HTTPS. Solo cámbiala a una
URL absoluta si vas a servir el frontend como build estático sin ese proxy
(por ejemplo, en un despliegue de producción).

## Roadmap futuro

No implementado en este MVP, pero la arquitectura ya lo permite sin
reescribir el resto de la app:

- **Fase 2:** reconocimiento visual real (reemplazar `MockDressRecognitionService`
  por una implementación con MediaPipe, TensorFlow.js o un servicio externo).
- **Fase 3:** body tracking con MediaPipe para anclar mejor los efectos AR a
  la persona.
- **Fase 4:** modelos 3D reales (GLTF/GLB) vía three.js para el tipo de
  efecto `model_3d`, que hoy usa un marcador CSS de reemplazo.
- **Fase 5:** LLM real — `GeminiProvider` ya está implementado; queda
  opcionalmente `OllamaProvider` (sin costo y demostrable sin internet) u
  `OpenAIProvider`.
- **Fase 6:** analítica de interacción (qué vestidos se ven más, tiempo por
  vestido, preguntas más frecuentes en el chat).
- **Fase 7:** panel de administración para crear/editar vestidos sin tocar
  la base de datos directamente.
- **Fase 8:** detección automática de prendas con un modelo de computer
  vision entrenado para esta pasarela específica.
