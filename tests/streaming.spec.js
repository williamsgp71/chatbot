import { test, expect } from '@playwright/test';
import app from '../src/server.js';

let server;
const PORT = 3001;

test.beforeAll(async () => {
  // Configurar entorno de pruebas
  process.env.PLAYWRIGHT_TEST = 'true';
  process.env.PORT = PORT.toString();
  
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[E2E Test Server] Running on port ${PORT}`);
      resolve();
    });
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log(`[E2E Test Server] Stopped`);
  }
});

test('streaming chat functionality works correctly in browser WITHOUT web search', async ({ page }) => {
  // 1. Navegar a la página
  await page.goto(`http://localhost:${PORT}`);

  // 2. Verificar estado inicial vacío
  await expect(page.locator('#empty-state')).toBeVisible();

  // 3. Escribir un mensaje en el campo de entrada
  const inputSelector = '#msg-input';
  await page.fill(inputSelector, 'Hola chatbot sin búsqueda!');

  // 4. Hacer clic en el botón de enviar
  const sendBtn = page.locator('#send-btn');
  await sendBtn.click();

  // 5. Esperar que se reciba el stream e IA dibuje la respuesta
  const typingRow = page.locator('#typing-row');
  await expect(typingRow).toBeVisible();
  await expect(typingRow).not.toBeVisible();

  const assistantBubble = page.locator('.message-row.assistant:not(#typing-row) .bubble').last();
  await expect(assistantBubble).toBeVisible();
  
  // 6. Validar que la respuesta NO contiene el indicador de búsqueda web y que el texto final se ha renderizado completamente
  await expect(assistantBubble).not.toContainText('Buscando en la web');
  await expect(assistantBubble).toHaveText('Hola desde el entorno de pruebas de Playwright!');
});

test('streaming chat functionality works correctly in browser WITH web search active', async ({ page }) => {
  // 1. Navegar a la página
  await page.goto(`http://localhost:${PORT}`);

  // 2. Activar la búsqueda web
  const webSearchBtn = page.locator('#web-search-btn');
  await expect(webSearchBtn).toBeVisible();
  
  // Verificar que inicialmente no está activo
  await expect(webSearchBtn).not.toHaveClass(/active/);
  
  // Activar haciendo clic
  await webSearchBtn.click();
  
  // Verificar que ahora tiene la clase active
  await expect(webSearchBtn).toHaveClass(/active/);

  // 3. Escribir un mensaje
  const inputSelector = '#msg-input';
  await page.fill(inputSelector, 'Clima en París hoy');

  // 4. Hacer clic en el botón de enviar
  const sendBtn = page.locator('#send-btn');
  await sendBtn.click();

  // 5. Esperar que se reciba el stream
  const typingRow = page.locator('#typing-row');
  await expect(typingRow).toBeVisible();
  await expect(typingRow).not.toBeVisible();

  const assistantBubble = page.locator('.message-row.assistant:not(#typing-row) .bubble').last();
  await expect(assistantBubble).toBeVisible();
  
  // 6. Validar que la respuesta SÍ contiene el indicador de búsqueda web y que se ha completado
  await expect(assistantBubble).toContainText('Buscando en la web');
  await expect(assistantBubble).toHaveText('\n*(Buscando en la web...)*\n\nHola desde el entorno de pruebas de Playwright!');
});
