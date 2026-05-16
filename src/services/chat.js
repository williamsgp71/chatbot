import supabase from './supabase.js';
import openrouter, { generateTitle, MODEL_NAME } from './openrouter.js';

const SYSTEM_PROMPT = 'Eres un asistente útil y conciso.';

export async function sendMessage(userContent, conversationId = null, onToken = null) {
  if (!conversationId) {
    const title = await generateTitle(userContent);
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select('id')
      .single();
    if (error) throw error;
    conversationId = data.id;
  }

  // Recuperar historial
  const { data: history, error: histError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (histError) throw histError;

  // Guardar mensaje del usuario
  const { error: insertError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'user', content: userContent });
  if (insertError) throw insertError;

  // Preparar mensajes para OpenRouter (formato OpenAI)
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userContent },
  ];

  let assistantContent = '';

  if (onToken) {
    // Modo Streaming
    const stream = await openrouter.chat.completions.create({
      model: MODEL_NAME,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        assistantContent += content;
        onToken(content);
      }
    }
  } else {
    // Modo Normal
    const completion = await openrouter.chat.completions.create({
      model: MODEL_NAME,
      messages,
    });
    assistantContent = completion.choices[0].message.content;
  }

  // Guardar respuesta del asistente completa
  const { error: saveError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'assistant', content: assistantContent });
  if (saveError) throw saveError;

  return { conversationId, message: { role: 'assistant', content: assistantContent } };
}
