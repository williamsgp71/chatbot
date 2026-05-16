import { Router } from 'express';
import { sendMessage } from '../services/chat.js';

const router = Router();

router.post('/', async (req, res) => {
  const { message, conversationId, stream: shouldStream } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'El campo "message" es requerido.' });
  }

  if (shouldStream) {
    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const result = await sendMessage(message.trim(), conversationId ?? null, (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      });
      
      res.write(`data: ${JSON.stringify({ done: true, conversationId: result.conversationId })}\n\n`);
      res.end();
    } catch (err) {
      console.error(err);
      res.write(`data: ${JSON.stringify({ error: 'Error al procesar el stream.' })}\n\n`);
      res.end();
    }
  } else {
    // Modo normal
    try {
      const result = await sendMessage(message.trim(), conversationId ?? null);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al procesar el mensaje.' });
    }
  }
});

export default router;
