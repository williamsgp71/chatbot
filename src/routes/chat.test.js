import { jest } from '@jest/globals';
import request from 'supertest';

// Mocking chat service for ESM
jest.unstable_mockModule('../services/chat.js', () => ({
  sendMessage: jest.fn(),
}));

// Use dynamic imports to ensure the mock is applied before the modules are loaded
const { default: app } = await import('../server.js');
const { sendMessage } = await import('../services/chat.js');

// Esta función describe un test para la ruta POST /api/chat que verifica que el endpoint responde con estado 400 si no se incluye el campo "message" en el cuerpo de la solicitud.
describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responde 400 si falta el campo message', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna conversationId y message cuando el servicio responde OK', async () => {
    sendMessage.mockResolvedValue({
      conversationId: 'abc-123',
      message: { role: 'assistant', content: 'Hola' },
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hola' });

    expect(res.status).toBe(200);
    expect(res.body.conversationId).toBe('abc-123');
    expect(res.body.message.role).toBe('assistant');
  });

  it('pasa el flag webSearch al servicio si se proporciona', async () => {
    sendMessage.mockResolvedValue({
      conversationId: 'abc-123',
      message: { role: 'assistant', content: 'Resultados de búsqueda' },
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Clima en Madrid', webSearch: true });

    expect(res.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledWith('Clima en Madrid', null, null, true);
  });

  it('transmite el flujo de tokens en modo streaming sin búsqueda web', async () => {
    sendMessage.mockImplementation((message, conversationId, onToken, webSearch) => {
      onToken('Hola');
      onToken(' mundo');
      return Promise.resolve({ conversationId: 'conv-123' });
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hola', stream: true, webSearch: false });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('data: {"token":"Hola"}');
    expect(res.text).toContain('data: {"token":" mundo"}');
    expect(res.text).toContain('data: {"done":true,"conversationId":"conv-123"}');
    expect(sendMessage).toHaveBeenCalledWith('Hola', null, expect.any(Function), false);
  });

  it('transmite el flujo de tokens en modo streaming con búsqueda web activa', async () => {
    sendMessage.mockImplementation((message, conversationId, onToken, webSearch) => {
      onToken('Buscando...');
      return Promise.resolve({ conversationId: 'conv-456' });
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Clima hoy', stream: true, webSearch: true });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('data: {"token":"Buscando..."}');
    expect(res.text).toContain('data: {"done":true,"conversationId":"conv-456"}');
    expect(sendMessage).toHaveBeenCalledWith('Clima hoy', null, expect.any(Function), true);
  });

  it('responde 500 si el servicio lanza un error', async () => {
    sendMessage.mockRejectedValue(new Error('fallo'));

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hola' });

    expect(res.status).toBe(500);
  });
});
