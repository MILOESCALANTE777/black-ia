import axios from 'axios';

// Groq es compatible con la API de OpenAI — mismo formato, diferente key y modelo
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Modelo principal: llama-3.3-70b-versatile (el mejor de Groq, gratis)
export const AI_MODEL = 'llama-3.3-70b-versatile';

// Para análisis de imágenes usamos llama-3.2-11b-vision-preview (soporta imágenes)
export const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

/**
 * Llama a la API de Groq (compatible con OpenAI).
 * Proxy: /api/openai → https://api.groq.com
 * - Desarrollo: Vite proxy (vite.config.ts)
 * - Producción: Express proxy (server.js)
 */
export async function openaiPost(body: object, timeout = 45000) {
  if (!GROQ_KEY) {
    throw new Error('VITE_GROQ_API_KEY no configurada');
  }

  const res = await axios.post('/api/openai/openai/v1/chat/completions', body, {
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout,
  });

  return res.data;
}
