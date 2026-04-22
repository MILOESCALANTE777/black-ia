import axios from 'axios';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Llama a la API de OpenAI a través del proxy.
 * - Desarrollo: Vite proxy en vite.config.ts → /api/openai → api.openai.com
 * - Producción: Express proxy en server.js → /api/openai → api.openai.com
 * El proxy funciona en ambos entornos, no se necesita fallback.
 */
export async function openaiPost(body: object, timeout = 45000) {
  if (!OPENAI_KEY) {
    throw new Error('VITE_OPENAI_API_KEY no configurada');
  }

  const res = await axios.post('/api/openai/v1/chat/completions', body, {
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout,
  });

  return res.data;
}
