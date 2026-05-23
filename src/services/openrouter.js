import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000', // Requerido por OpenRouter
    'X-Title': 'Chatbot API',
  },
});

export const MODEL_NAME = 'deepseek/deepseek-v4-flash';

export async function generateTitle(firstMessage) {
  try {
    const completion = await openrouter.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'Genera un título corto y descriptivo (máximo 8 palabras) para una conversación que comienza con este mensaje. Devuelve únicamente el título, sin comillas ni puntuación al final.',
        },
        { role: 'user', content: firstMessage },
      ],
      max_tokens: 25,
    });
    const content = completion.choices[0]?.message?.content;
    return content ? content.trim() : 'Nueva Conversación';
  } catch (error) {
    console.error('Error in generateTitle (OpenRouter):', error);
    return 'Nueva Conversación';
  }
}

export default openrouter;
