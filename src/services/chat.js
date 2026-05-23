import supabase from './supabase.js';
import openrouter, { generateTitle, MODEL_NAME } from './openrouter.js';
import { performWebSearch } from './search.js';

const SYSTEM_PROMPT = 'Eres un asistente útil y conciso. Si utilizas información de una búsqueda en la web, cita las fuentes de manera breve.';

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Busca información actualizada en internet sobre un tema específico.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'La consulta de búsqueda para encontrar información relevante.',
          },
        },
        required: ['query'],
      },
    },
  },
];

export async function sendMessage(userContent, conversationId = null, onToken = null, webSearch = false) {
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
  const apiParams = {
    model: MODEL_NAME,
    messages,
  };

  if (webSearch) {
    apiParams.tools = TOOLS;
  }

  if (onToken) {
    // Modo Streaming con soporte para Tool Calling
    let stream = await openrouter.chat.completions.create({
      ...apiParams,
      stream: true,
    });

    let toolCalls = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.tool_calls) {
        // Acumular tool calls
        for (const tc of delta.tool_calls) {
          if (!toolCalls[tc.index]) {
            toolCalls[tc.index] = { id: tc.id, type: 'function', function: { name: '', arguments: '' } };
          }
          if (tc.id) toolCalls[tc.index].id = tc.id;
          if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
          if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
        }
      } else {
        const content = delta?.content || '';
        if (content) {
          assistantContent += content;
          onToken(content);
        }
      }
    }

    // Si hubo tool calls, ejecutarlas y re-llamar al modelo
    if (toolCalls.length > 0) {
      // Por simplicidad, manejamos la primera búsqueda
      const toolCall = toolCalls[0];
      if (toolCall.function.name === 'web_search') {
        try {
          const { query } = JSON.parse(toolCall.function.arguments);
          const searchResults = await performWebSearch(query);

          // Agregar historial
          messages.push({
            role: 'assistant',
            content: null,
            tool_calls: toolCalls.filter(tc => tc !== undefined),
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: 'web_search',
            content: JSON.stringify(searchResults),
          });

          // Informar al usuario
          onToken('\n*(Buscando en la web...)*\n\n');

          // Generar respuesta final con reintentos
          let secondStream;
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            try {
              secondStream = await openrouter.chat.completions.create({
                model: MODEL_NAME,
                messages,
                stream: true,
              });
              break;
            } catch (err) {
              attempts++;
              if (attempts >= maxAttempts) throw err;
              console.warn(`Reintento ${attempts} tras error:`, err.message);
              await new Promise(r => setTimeout(r, 2000));
            }
          }

          for await (const chunk of secondStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              assistantContent += content;
              onToken(content);
            }
          }
        } catch (error) {
          console.error('Error procesando web_search:', error);
          const fallback = '\n\n⚠️ Lo siento, hubo un error al procesar la búsqueda. Por favor, intenta de nuevo.';
          assistantContent += fallback;
          onToken(fallback);
        }
      }
    }
  } else {
    // Modo Normal
    let completion = await openrouter.chat.completions.create(apiParams);
    let message = completion.choices[0].message;

    if (message.tool_calls && webSearch) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === 'web_search') {
        const { query } = JSON.parse(toolCall.function.arguments);
        const searchResults = await performWebSearch(query);

        messages.push(message);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: 'web_search',
          content: JSON.stringify(searchResults),
        });

        try {
          const secondCompletion = await openrouter.chat.completions.create({
            model: MODEL_NAME,
            messages,
          });
          assistantContent = secondCompletion.choices[0].message.content;
        } catch (secondError) {
          console.error('Error en la segunda llamada (normal):', secondError);
          assistantContent = '⚠️ Hubo un error al procesar los resultados de la búsqueda.';
        }
      }
    } else {
      assistantContent = message.content;
    }
  }

  // Guardar respuesta del asistente completa
  const { error: saveError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'assistant', content: assistantContent });
  if (saveError) throw saveError;

  return { conversationId, message: { role: 'assistant', content: assistantContent } };
}
