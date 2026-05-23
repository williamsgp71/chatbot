import { Router } from 'express';
import supabase, { supabaseAdmin } from '../services/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  if (process.env.PLAYWRIGHT_TEST === 'true') {
    return res.json([
      { id: 'test-conv-123', title: 'Prueba de Playwright', created_at: new Date().toISOString() }
    ]);
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id/messages', async (req, res) => {
  if (process.env.PLAYWRIGHT_TEST === 'true') {
    return res.json([
      { id: 'msg-1', role: 'user', content: 'Hola', created_at: new Date().toISOString() },
      { id: 'msg-2', role: 'assistant', content: 'Hola desde el entorno de pruebas de Playwright!', created_at: new Date().toISOString() }
    ]);
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/title', async (req, res) => {
  const { title } = req.body;
  const { id } = req.params;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const { data, error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id)
    .select('id, title, created_at')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (process.env.PLAYWRIGHT_TEST === 'true') {
    return res.json({ success: true });
  }

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, id: data.id });
});

export default router;

