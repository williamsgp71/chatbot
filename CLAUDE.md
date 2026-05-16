# chatbot-api

REST API de chatbot construida con Node.js, Express, OpenAI y Supabase.

## Stack
- **Runtime**: Node.js (ESM)
- **Framework**: Express 5
- **IA**: OpenAI SDK
- **Base de datos**: Supabase (`@supabase/supabase-js`)
- **Tests**: Jest + Supertest

## Estructura
```
src/
  server.js              # Entry point, monta rutas
  routes/
    chat.js              # POST /api/chat
    conversations.js     # GET  /api/conversations
  services/              # Lógica de negocio (OpenAI, Supabase)
```

## Configuración
Copia `.env.example` a `.env` y completa las variables:
- `OPENAI_API_KEY` — clave de API de OpenAI
- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_KEY` — clave anon de Supabase
- `PORT` — puerto del servidor (default 3000)

## Comandos
```bash
npm run dev    # Servidor con hot-reload (--watch)
npm start      # Servidor en producción
npm test       # Ejecutar tests con Jest (ESM)
```
