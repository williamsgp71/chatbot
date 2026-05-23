# Plan de Integración: Búsqueda en la Web

Este documento detalla los cambios necesarios para añadir la funcionalidad de "Búsqueda en la Web" al chatbot. El modelo podrá conectarse a internet solo cuando el usuario active esta opción mediante un botón en la interfaz.

## 1. Cambios en el Frontend (`public/index.html`)

Se añadirá un interruptor (toggle) o botón cerca del área de entrada de texto.

- **UI**: Un pequeño botón con un icono de globo terráqueo y el texto "Buscar en la web".
- **Estado**: Una variable global o de componente `webSearchEnabled` (booleano).
- **Lógica**: 
    - Al hacer clic, se alterna el estado visual del botón.
    - Al llamar a `sendMessage()`, se incluye `webSearch: webSearchEnabled` en el cuerpo del `POST /api/chat`.

## 2. Cambios en las Rutas (`src/routes/chat.js`)

Se actualizará el endpoint para recibir y pasar la nueva bandera.

- **Extracción**: Obtener `webSearch` de `req.body`.
- **Delegación**: Pasar `webSearch` como argumento a la función `sendMessage` del servicio de chat.

## 3. Nuevo Servicio de Búsqueda (`src/services/search.js`)

Se creará un servicio dedicado para realizar las búsquedas reales. 

- **Proveedor Sugerido**: [Tavily API](https://tavily.com/) o [Brave Search API](https://api.search.brave.com/), ya que están optimizados para LLMs.
- **Implementación**: Una función `performWebSearch(query)` que devuelva los resultados más relevantes (título, contenido, URL).

## 4. Cambios en el Servicio de Chat (`src/services/chat.js`)

Este es el núcleo de la integración, utilizando **OpenAI Tool Calling**.

- **Definición de Herramientas**: Definir un objeto `tools` que describa la función `web_search`.
- **Lógica de Ejecución**:
    1. Si `webSearch` es `true`, incluir `tools` en la llamada a OpenRouter.
    2. Si el modelo decide llamar a la herramienta (`tool_calls` en la respuesta):
        - Ejecutar `performWebSearch`.
        - Enviar los resultados de vuelta al modelo.
        - Generar la respuesta final basada en los resultados de búsqueda.
- **Prompt del Sistema**: Actualizar temporalmente el prompt si la búsqueda está activa para que el modelo sepa cómo citar fuentes.

## 5. Configuración de Entorno (`.env`)

Se requerirán nuevas variables:
- `SEARCH_API_KEY`: Clave para el proveedor de búsqueda elegido.
- `SEARCH_PROVIDER`: (Opcional) 'tavily', 'brave', etc.

## Pasos de Implementación

1.  **Fase 1 (Backend)**: Crear `src/services/search.js` con una implementación mock inicial.
2.  **Fase 2 (Herramientas)**: Modificar `src/services/chat.js` para soportar `tool_calling` (nota: DeepSeek soporta tools, pero hay que asegurar que la librería `openai` lo maneje correctamente vía OpenRouter).
3.  **Fase 3 (Rutas)**: Actualizar `src/routes/chat.js`.
4.  **Fase 4 (Frontend)**: Añadir el botón y la lógica de estado en `index.html`.
5.  **Fase 5 (Pruebas)**: Validar que el modelo solo busque en la web cuando el botón esté activado.

---
*Nota: Dado que el modelo actual es `deepseek-v4-flash`, su soporte para herramientas es excelente, lo que permitirá respuestas rápidas y precisas.*
