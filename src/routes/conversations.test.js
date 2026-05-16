import { jest } from '@jest/globals';
import request from 'supertest';

// Mocking Supabase service for ESM
jest.unstable_mockModule('../services/supabase.js', () => ({
  default: {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// Use dynamic imports to ensure the mock is applied before the modules are loaded
const { default: app } = await import('../server.js');
const { default: supabase } = await import('../services/supabase.js');

describe('POST /api/conversations/:id/title', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responde 400 si falta el campo title', async () => {
    const res = await request(app)
      .post('/api/conversations/123/title')
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title is required');
  });

  it('actualiza el título correctamente', async () => {
    const mockData = { id: '123', title: 'Nuevo Título', created_at: '2023-01-01' };
    supabase.from().update().eq().select().single.mockResolvedValue({ data: mockData, error: null });

    const res = await request(app)
      .post('/api/conversations/123/title')
      .send({ title: 'Nuevo Título' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Nuevo Título');
    expect(supabase.from).toHaveBeenCalledWith('conversations');
    expect(supabase.update).toHaveBeenCalledWith({ title: 'Nuevo Título' });
    expect(supabase.eq).toHaveBeenCalledWith('id', '123');
  });

  it('responde 500 si hay un error de base de datos', async () => {
    supabase.from().update().eq().select().single.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

    const res = await request(app)
      .post('/api/conversations/123/title')
      .send({ title: 'Nuevo Título' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB Error');
  });
});
