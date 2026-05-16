# Project Context: chatbot-api

This is a REST API for a chatbot built with Node.js (ESM), Express 5, OpenAI, and Supabase.

## Project Overview
The application facilitates conversational interactions by integrating with OpenAI's `gpt-4o-mini` model and persisting chat history in a Supabase database. It follows a service-oriented architecture where routes handle HTTP concerns and services manage business logic and external integrations.

### Main Technologies
- **Runtime:** Node.js (configured as ESM via `"type": "module"` in `package.json`).
- **Framework:** Express 5.
- **AI Integration:** OpenAI SDK for chat completions and title generation.
- **Database:** Supabase (PostgreSQL) for storing conversations and messages.
- **Testing:** Jest with Supertest for integration testing.

## Building and Running
The following commands are defined in `package.json`:

- **Development:** `npm run dev` (runs the server with `--watch` mode).
- **Production:** `npm start` (runs the server normally).
- **Testing:** `npm test` (executes Jest tests with experimental VM modules support for ESM).
- **Utility:** `npm run update-titles` (runs `scripts/update-titles.js`).

### Configuration
Environment variables are managed via a `.env` file (see `.env.example`):
- `OPENAI_API_KEY`: API key for OpenAI services.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_KEY`: Supabase anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations (used in `supabaseAdmin` client).
- `PORT`: Port on which the server listens (default: 3000).

## Architecture & Structure
- `src/server.js`: The main entry point. Configures middleware, static files, and routes.
- `src/routes/`:
    - `chat.js`: Handles message submission (`POST /api/chat`).
    - `conversations.js`: Handles conversation listing and message history retrieval (`GET /api/conversations`).
- `src/services/`:
    - `chat.js`: Orchestrates the message flow, history management, and OpenAI calls.
    - `openai.js`: Configures the OpenAI client and provides title generation logic.
    - `supabase.js`: Configures the Supabase clients (`supabase` and `supabaseAdmin`).
- `supabase/schema.sql`: Contains the database schema definitions for `conversations` and `messages` tables.

## Development Conventions
- **ESM:** Use `import`/`export` syntax exclusively.
- **Service Pattern:** Keep business logic, OpenAI prompting, and database queries within `src/services/`.
- **Error Handling:** Routes should catch service errors and respond with appropriate HTTP status codes (400 for user errors, 500 for internal errors).
- **Testing:** New features or route changes should be accompanied by tests in `*.test.js` files using Jest and Supertest.
- **Database:** Adhere to the schema defined in `supabase/schema.sql`. Use UUIDs for IDs and ensure proper foreign key relationships.
