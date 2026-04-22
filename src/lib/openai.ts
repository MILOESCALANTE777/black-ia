import axios from 'axios';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Llama a la API de OpenAI.
 * En producción usa el proxy /api/openai (server.js).
 * En desarrollo llama directo a api.openai.com.
 */
export async function openaiPost(body: object, timeout = 60000) {
  const headers = {
    Authorization: `Bearer ${OPENAI_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // Primero intenta el proxy (funciona en producción con server.js)
    const res = await axios.post('/api/openai/v1/chat/completions', body, { headers, timeout });
    return res.data;
  } catch (proxyErr: any) {
    const isProxyMissing =
      proxyErr.response?.status === 404 ||
      proxyErr.code === 'ERR_NETWORK' ||
      proxyErr.message?.includes('404') ||
      proxyErr.message?.includes('Network Error');

    if (isProxyMissing) {
      // Fallback: llamada directa a OpenAI (desarrollo local)
      const res = await axios.post('https://api.openai.com/v1/chat/completions', body, { headers, timeout });
      return res.data;
    }
    throw proxyErr;
  }
}
