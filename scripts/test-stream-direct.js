import 'dotenv/config';

async function runDirectTests() {
  const url = 'http://localhost:3000/api/chat';
  
  console.log('==================================================');
  console.log('PROBANDO STREAMING DIRECTO (SIN PLAYWRIGHT)');
  console.log('==================================================');

  // CASO 1: Búsqueda Web DESACTIVADA
  console.log('\n--- CASO 1: Búsqueda Web DESACTIVADA (webSearch = false) ---');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Dime una palabra corta e inspiradora.',
        stream: true,
        webSearch: false
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              process.stdout.write(data.token);
            }
            if (data.done) {
              console.log('\n[Done] Conversation ID:', data.conversationId);
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error('Error en Caso 1:', err);
  }

  // CASO 2: Búsqueda Web ACTIVADA
  console.log('\n\n--- CASO 2: Búsqueda Web ACTIVADA (webSearch = true) ---');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '¿Cuál es el clima actual en Madrid? Sé muy breve.',
        stream: true,
        webSearch: true
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              process.stdout.write(data.token);
            }
            if (data.done) {
              console.log('\n[Done] Conversation ID:', data.conversationId);
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error('Error en Caso 2:', err);
  }
  
  console.log('\n==================================================');
  console.log('FIN DE LAS PRUEBAS DIRECTAS');
  console.log('==================================================\n');
}

runDirectTests();
