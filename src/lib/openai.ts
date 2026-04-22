import axios from 'axios';

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const KIMI_KEY = import.meta.env.VITE_KIMI_API_KEY;

/**
 * Limpia la respuesta del modelo — algunos modelos devuelven ```json ... ```
 * en lugar de JSON puro. Esta función extrae el JSON limpio.
 */
export function parseModelJSON(content: string): any {
  // Remover markdown code blocks
  let clean = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // Si empieza con { o [ es JSON válido directo
  if (clean.startsWith('{') || clean.startsWith('[')) {
    return JSON.parse(clean);
  }
  
  // Buscar el primer { o [ en el texto
  const jsonStart = clean.search(/[{[]/);
  if (jsonStart !== -1) {
    const jsonEnd = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    if (jsonEnd !== -1) {
      return JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
    }
  }
  
  throw new Error('No se encontró JSON válido en la respuesta');
}

/**
 * GROQ — para chat, análisis de texto, noticias, quant (gratis)
 * Proxy: /api/openai → https://api.groq.com
 */
export async function openaiPost(body: object, timeout = 45000) {
  if (!GROQ_KEY) throw new Error('VITE_GROQ_API_KEY no configurada');

  const res = await axios.post('/api/openai/openai/v1/chat/completions', body, {
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout,
  });

  return res.data;
}

/**
 * KIMI — para análisis de imágenes con visión
 * Proxy: /api/kimi → https://api.moonshot.ai
 * Fallback a Groq (llama-4-scout) si Kimi no tiene saldo
 */
export async function kimiVisionPost(base64Image: string, prompt: string, timeout = 60000) {
  // Intentar con Kimi primero (mejor calidad para imágenes)
  if (KIMI_KEY) {
    try {
      const res = await axios.post('/api/kimi/v1/chat/completions', {
        model: 'moonshot-v1-32k-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          ],
        }],
        temperature: 0.2,
        max_tokens: 2000,
      }, {
        headers: {
          Authorization: `Bearer ${KIMI_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout,
      });
      console.log('✅ Análisis con Kimi Vision');
      return res.data;
    } catch (err: any) {
      // Si Kimi falla por saldo, usar Groq como fallback
      const isQuotaError = err.response?.data?.error?.type?.includes('quota') ||
                           err.response?.data?.error?.message?.includes('balance') ||
                           err.response?.status === 429;
      if (isQuotaError) {
        console.warn('⚠️ Kimi sin saldo, usando Groq Vision como fallback...');
      } else {
        throw err;
      }
    }
  }

  // Fallback: Groq con llama-4-scout (también soporta imágenes)
  if (!GROQ_KEY) throw new Error('Ninguna API de visión disponible');

  console.log('✅ Análisis con Groq Vision (llama-4-scout)');
  const res = await axios.post('/api/openai/openai/v1/chat/completions', {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
      ],
    }],
    temperature: 0.2,
    max_tokens: 2000,
  }, {
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout,
  });

  return res.data;
}
