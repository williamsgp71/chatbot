import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateTitle(firstMessage) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Genera un título corto y descriptivo (máximo 8 palabras) para una conversación que comienza con este mensaje. Devuelve únicamente el título, sin comillas ni puntuación al final.',
      },
      { role: 'user', content: firstMessage },
    ],
    max_tokens: 25,
  });
  return completion.choices[0].message.content.trim();
}

async function main() {
  console.log('Obteniendo todas las conversaciones...');

  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select('id, title')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al obtener conversaciones:', error.message);
    process.exit(1);
  }

  console.log(`Se encontraron ${conversations.length} conversaciones.\n`);

  for (const conv of conversations) {
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('content')
      .eq('conversation_id', conv.id)
      .eq('role', 'user')
      .order('created_at', { ascending: true })
      .limit(1);

    if (msgError || !messages?.length) {
      console.log(`[${conv.id}] Sin mensajes, omitiendo.`);
      continue;
    }

    const firstMessage = messages[0].content;
    console.log(`[${conv.id}] Primer mensaje: "${firstMessage.slice(0, 60)}..."`);

    const newTitle = await generateTitle(firstMessage);

    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ title: newTitle })
      .eq('id', conv.id);

    if (updateError) {
      console.error(`  ERROR al actualizar: ${updateError.message}`);
    } else {
      console.log(`  Título actualizado: "${newTitle}"\n`);
    }
  }

  console.log('¡Proceso completado!');
}

main();
