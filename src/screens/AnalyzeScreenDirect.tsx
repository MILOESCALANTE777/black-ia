import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageIcon, Upload, TrendingUp, TrendingDown, Minus, Target, Shield, ChevronDown, ChevronUp, RefreshCw, Brain } from 'lucide-react';
import { useStore } from '@/store/useStore';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisionStrategy {
  name: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rr: string;
  description: string;
  conditions: string[];
}

interface VisionAnalysis {
  symbol: string;
  timeframe: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  biasStrength: number;
  currentPrice: number;
  reasoning: string;
  marketStructure: string;
  strategies: VisionStrategy[];
  orderBlocks: { type: 'bullish' | 'bearish'; zone: string; strength: string }[];
  keyLevels: { supports: string[]; resistances: string[] };
  indicators: { ema: string; rsi: string; macd: string; volume: string };
  probability: { bullish: number; bearish: number };
  recommendation: string;
}

// ─── GPT-4o Vision call DIRECTO (sin proxy) ──────────────────────────────────

async function analyzeChartImageDirect(base64Image: string, symbol: string): Promise<VisionAnalysis> {
  // Verificar que la API key esté configurada
  if (!OPENAI_KEY || OPENAI_KEY === 'undefined') {
    throw new Error('❌ API key de OpenAI no configurada. Verifica tu archivo .env\n\nVariable requerida: VITE_OPENAI_API_KEY');
  }

  console.log('🔍 Iniciando análisis DIRECTO (sin proxy)...');
  console.log('📊 Activo:', symbol || 'Desconocido');
  console.log('🔑 API Key:', OPENAI_KEY.substring(0, 20) + '...');
  console.log('📏 Tamaño de imagen (base64):', base64Image.length, 'caracteres');

  const prompt = `Eres un analista técnico experto. Analiza este gráfico de trading.

ACTIVO: ${symbol || 'Desconocido'}

Analiza: estructura de mercado, order blocks, soportes, resistencias, EMAs, RSI, MACD, velas, fibonacci, volumen.

Responde SOLO en JSON:
{
  "symbol": "símbolo o Desconocido",
  "timeframe": "temporalidad",
  "bias": "bullish" | "bearish" | "neutral",
  "biasStrength": 0-100,
  "currentPrice": 0,
  "reasoning": "análisis en 3-4 oraciones",
  "marketStructure": "descripción de estructura",
  "strategies": [
    {
      "name": "nombre",
      "bias": "bullish" | "bearish" | "neutral",
      "confidence": 0-100,
      "entry": 0,
      "sl": 0,
      "tp1": 0,
      "tp2": 0,
      "tp3": 0,
      "rr": "1:X",
      "description": "descripción",
      "conditions": ["cond1", "cond2"]
    }
  ],
  "orderBlocks": [
    { "type": "bullish" | "bearish", "zone": "bajo-alto", "strength": "strong" | "moderate" | "weak" }
  ],
  "keyLevels": {
    "supports": ["nivel1", "nivel2"],
    "resistances": ["nivel1", "nivel2"]
  },
  "indicators": {
    "ema": "estado EMAs",
    "rsi": "estado RSI",
    "macd": "estado MACD",
    "volume": "análisis volumen"
  },
  "probability": {
    "bullish": 0-100,
    "bearish": 0-100
  },
  "recommendation": "recomendación concreta"
}`;

  try {
    console.log('📡 Enviando request a OpenAI API directamente...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'high'
              } 
            },
          ],
        }],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    console.log('📥 Respuesta recibida. Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error response:', errorData);
      
      if (response.status === 401) {
        throw new Error('❌ API key inválida (401)\n\nVerifica que tu API key sea correcta en el archivo .env');
      } else if (response.status === 429) {
        throw new Error('❌ Límite de rate excedido (429)\n\nEspera unos minutos e intenta de nuevo.');
      } else if (response.status === 400) {
        throw new Error('❌ Request inválido (400)\n\nLa imagen puede ser muy grande o estar corrupta.\n\n' + JSON.stringify(errorData, null, 2));
      } else if (response.status >= 500) {
        throw new Error('❌ Error del servidor de OpenAI (' + response.status + ')\n\nIntenta de nuevo en unos momentos.');
      }
      
      throw new Error(`❌ Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Data recibida:', data);

    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('❌ Respuesta inválida de OpenAI\n\nNo se recibió contenido en la respuesta.');
    }

    const parsed = JSON.parse(data.choices[0].message.content);
    console.log('✅ Análisis completado exitosamente');
    
    return parsed;
  } catch (error: any) {
    console.error('❌ Error en análisis:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('❌ Error de red\n\nNo se pudo conectar con OpenAI. Verifica tu conexión a internet.');
    }
    
    throw error;
  }
}

// ─── Componente principal (igual que antes pero usando analyzeChartImageDirect) ───

export default function AnalyzeScreenDirect() {
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setCapturedImage = useStore((s) => s.setCapturedImage);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [symbol, setSymbol] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('📁 Archivo seleccionado:', file.name, file.size, 'bytes');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);
      setCapturedImage(dataUrl);
      const b64 = dataUrl.split(',')[1];
      setBase64Image(b64);
      console.log('✅ Imagen convertida a base64');
    };
    reader.readAsDataURL(file);
  }, [setCapturedImage]);

  const handleGalleryClick = () => fileInputRef.current?.click();

  const handleAnalyze = async () => {
    if (!base64Image) {
      setError('❌ No hay imagen para analizar\n\nPor favor, sube una imagen primero.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando análisis...');
      const result = await analyzeChartImageDirect(base64Image, symbol);
      console.log('✅ Análisis completado:', result);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('❌ Error capturado:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPreviewImage(null);
    setBase64Image(null);
    setAnalysisResult(null);
    setError(null);
    setSymbol('');
  };

  const handleClose = () => setActiveTab('home');

  // ── Analyzing state ──
  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black gap-5 px-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Brain size={40} color="#AF52DE" />
        </motion.div>
        <div className="text-center">
          <p className="text-white font-bold text-lg">Analizando con GPT-4o (Conexión Directa)</p>
          <p className="text-sm text-[#636366] mt-1">Esto puede tomar 30-60 segundos...</p>
        </div>
      </div>
    );
  }

  // ── Result state ──
  if (analysisResult) {
    return (
      <div className="flex-1 flex flex-col bg-black">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#1C1C1E]">
          <button onClick={handleReset} className="p-1"><X size={22} color="#FFFFFF" /></button>
          <h3 className="text-base font-bold text-white">Análisis Completado ✅</h3>
          <button onClick={handleAnalyze} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1C1C1E]">
            <RefreshCw size={14} color="#8E8E93" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="text-xs text-white bg-[#1C1C1E] p-4 rounded-xl overflow-auto">
            {JSON.stringify(analysisResult, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // ── Upload state ──
  return (
    <div className="flex-1 flex flex-col bg-black">
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#1C1C1E]">
        <button onClick={handleClose} className="p-1"><X size={24} color="#FFFFFF" /></button>
        <h3 className="text-lg font-bold text-white">Analizar Gráfico (Directo)</h3>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
        {previewImage ? (
          <div className="w-full max-w-lg">
            <img src={previewImage} alt="Preview" className="w-full h-72 object-cover rounded-2xl mb-4" />
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Activo (opcional)"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none mb-3 bg-[#1C1C1E] border border-[#38383A]"
            />
            <button
              onClick={handleAnalyze}
              className="w-full py-4 rounded-full font-bold text-white bg-gradient-to-r from-[#AF52DE] to-[#007AFF] mb-2"
            >
              <Brain size={18} className="inline mr-2" />
              Analizar con GPT-4o (Directo)
            </button>
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-full text-sm text-[#8E8E93] bg-[#1C1C1E]"
            >
              Cambiar imagen
            </button>
          </div>
        ) : (
          <div className="text-center w-full max-w-lg">
            <div className="w-16 h-16 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mx-auto mb-4">
              <Brain size={32} color="#AF52DE" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Análisis Directo</h2>
            <p className="text-sm text-[#636366] mb-6">Conexión directa a OpenAI (sin proxy)</p>
            <div
              onClick={handleGalleryClick}
              className="w-full h-56 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#1C1C1E] border-2 border-dashed border-[#38383A]"
            >
              <Upload size={36} color="#38383A" />
              <p className="text-sm text-[#636366]">Click para subir imagen</p>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-[#FF3B3015] border border-[#FF3B3030] max-w-lg w-full"
          >
            <pre className="text-xs text-[#FF3B30] whitespace-pre-wrap font-mono">
              {error}
            </pre>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-xs font-medium text-[#FF3B30] underline"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
