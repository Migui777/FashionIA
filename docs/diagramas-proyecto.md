# Diagramas del proyecto Fashion-IA

Este documento reúne los diagramas Entidad-Relación, casos de uso y máquina
de estados del proyecto. Los diagramas reflejan el modelo de datos y el flujo
actual del chatbot.

## 1. Diagrama Entidad-Relación

El modelo persistido actual contiene una entidad `Dress`. Sus atributos
opcionales están indicados en el diagrama. No se incluyen relaciones porque
el esquema actual no define otras entidades relacionadas.

```mermaid
erDiagram
    DRESS {
        string id PK
        string name
        string description "opcional"
        string designer "opcional"
        string collection "opcional"
        string category "opcional"
        string color "opcional"
        string materials "opcional"
        string imageUrl "opcional"
        string model3dUrl "opcional"
        AREffectType arEffectType
        string arEffectAssetUrl "opcional"
        float arEffectIntensity
        string story "opcional"
        datetime createdAt
        datetime updatedAt
    }
```

## 2. Diagrama de casos de uso

```mermaid
flowchart LR
    PERSONA([Persona usuaria])
    CHAT([Consultar chatbot])
    PREGUNTAR([Preguntar por una prenda])
    DATOS([Consultar materiales, creador o inspiración])
    FUENTE([Consultar respuesta y fuente])
    SIN_EVIDENCIA([Recibir aviso si falta información])
    POSTGRES([Configurar catálogo PostgreSQL])
    GEMINI([Activar redacción opcional con Gemini])

    PERSONA --- CHAT
    CHAT --- PREGUNTAR
    CHAT --- DATOS
    CHAT --- FUENTE
    CHAT --- SIN_EVIDENCIA
    POSTGRES --- CHAT
    GEMINI --- CHAT
```

## 3. Diagrama de máquina de estados de una consulta

```mermaid
stateDiagram-v2
    [*] --> EsperandoPregunta
    EsperandoPregunta --> Validando: persona envía pregunta
    Validando --> EntradaInvalida: datos inválidos
    EntradaInvalida --> EsperandoPregunta: corregir y volver a enviar
    Validando --> BuscandoPrenda: datos válidos
    BuscandoPrenda --> FueraDeAlcance: pregunta ajena al catálogo
    BuscandoPrenda --> VerificandoEvidencia: prenda identificada
    VerificandoEvidencia --> SinEvidencia: dato solicitado ausente
    VerificandoEvidencia --> RespuestaDeterminista: dato respaldado
    RespuestaDeterminista --> RedaccionGemini: Gemini disponible
    RespuestaDeterminista --> RespuestaLista: Gemini no configurado o falla
    RedaccionGemini --> RespuestaLista: redacción completada
    FueraDeAlcance --> RespuestaLista
    SinEvidencia --> RespuestaLista
    EntradaInvalida --> RespuestaLista: responder error de validación
    RespuestaLista --> EsperandoPregunta: mostrar resultado
```
