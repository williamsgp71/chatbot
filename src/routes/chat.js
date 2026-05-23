import { Router } from 'express';
import { sendMessage } from '../services/chat.js';

const router = Router();

router.post('/', async (req, res) => {
  const { message, conversationId, stream: shouldStream, webSearch } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'El campo "message" es requerido.' });
  }

  if (process.env.PLAYWRIGHT_TEST === 'true') {
    if (shouldStream) {
      // Simular latencia de red inicial de 300ms para permitir probar el indicador de "escribiendo"
      await new Promise(resolve => setTimeout(resolve, 300));

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('Content-Encoding', 'identity');
      res.flushHeaders();

      try {
        const tokens = [];
        if (webSearch) {
          tokens.push('\n*(Buscando en la web...)*\n\n');
        }
        tokens.push('Hola', ' desde', ' el', ' entorno', ' de', ' pruebas', ' de', ' Playwright!');
        
        for (const token of tokens) {
          await new Promise(resolve => setTimeout(resolve, 80));
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
          if (typeof res.flush === 'function') {
            res.flush();
          }
        }
        res.write(`data: ${JSON.stringify({ done: true, conversationId: conversationId || 'test-conv-123' })}\n\n`);
        if (typeof res.flush === 'function') {
          res.flush();
        }
        res.end();
      } catch (err) {
        console.error(err);
        res.write(`data: ${JSON.stringify({ error: 'Error al procesar el stream de pruebas.' })}\n\n`);
        res.end();
      }
    } else {
      res.json({
        conversationId: conversationId || 'test-conv-123',
        message: { role: 'assistant', content: 'Hola desde el entorno de pruebas de Playwright!' }
      });
    }
    return;
  }

  if (shouldStream) {
    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform'); // no-transform evita compresión/modificación en proxies
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Evitar almacenamiento en búfer (buffering) en proxies como Nginx
    res.setHeader('Content-Encoding', 'identity'); // Evitar compresión gzipp/deflate que bufferiza el stream
    res.flushHeaders(); // Enviar cabeceras inmediatamente al cliente

    try {
      const result = await sendMessage(message.trim(), conversationId ?? null, (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
        if (typeof res.flush === 'function') {
          res.flush(); // Forzar el envío si hay compresión/búfer activo
        }
      }, !!webSearch);
      
      res.write(`data: ${JSON.stringify({ done: true, conversationId: result.conversationId })}\n\n`);
      if (typeof res.flush === 'function') {
        res.flush();
      }
      res.end();
    } catch (err) {
      console.error(err);
      res.write(`data: ${JSON.stringify({ error: 'Error al procesar el stream.' })}\n\n`);
      res.end();
    }
  } else {
    // Modo normal
    try {
      const result = await sendMessage(message.trim(), conversationId ?? null, null, !!webSearch);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al procesar el mensaje.' });
    }
  }
});

export default router;
