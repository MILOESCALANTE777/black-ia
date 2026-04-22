import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageIcon, Zap, Upload, TrendingUp, TrendingDown, Minus, Target, Shield, ChevronDown, ChevronUp, RefreshCw, Brain } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { openaiPost } from '@/lib/openai';

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

// ─── GPT-4o Vision call ───────────────────────────────────────────────────────

async function analyzeChartImage(
  base64Image: string,
  symbol: string,
  userProfile?: any
): Promise<VisionAnalysis> {

  // Contexto del perfil del usuario
  let userContext = '';
  if (userProfile) {
    const expMap: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', expert: 'Experto' };
    const styleMap: Record<string, string> = { scalper: 'Scalper', day_trader: 'Day Trader', swing_trader: 'Swing Trader', position_trader: 'Position Trader' };
    const riskMap: Record<string, string> = { conservative: 'Conservador (1-2%)', moderate: 'Moderado (2-3%)', aggressive: 'Agresivo (3-5%)' };
    userContext = `\n\nPERFIL DEL TRADER:\n- Experiencia: ${expMap[userProfile.experience_level] || userProfile.experience_level}\n- Estilo: ${styleMap[userProfile.trading_style] || userProfile.trading_style}\n- Mercados: ${userProfile.preferred_markets?.join(', ') || 'Todos'}\n- Riesgo: ${riskMap[userProfile.risk_tolerance] || userProfile.risk_tolerance}\n- Timeframes: ${userProfile.preferred_timeframes?.join(', ') || '1h, 4h'}\n- Max riesgo/trade: ${userProfile.max_risk_per_trade || 2}%\n- R:R preferido: 1:${userProfile.preferred_rr_ratio || 2}\n\nAdapta el análisis, lenguaje y estrategias a este perfil.`;
  }

  const prompt = `Eres un analista técnico experto de nivel institucional. Analiza esta imagen de gráfico de trading.

ACTIVO: ${symbol || 'Desconocido'}${userContext}

Analiza: estructura de mercado (HH/HL o LH/LL), order blocks, soportes/resistencias, EMAs, RSI, MACD, patrones de velas, Fibonacci, volumen y temporalidad.

Responde ÚNICAMENTE en este JSON (sin texto adicional):
{
  "symbol": "símbolo visible o Desconocido",
  "timeframe": "temporalidad estimada",
  "bias": "bullish|bearish|neutral",
  "biasStrength": 0,
  "currentPrice": 0,
  "reasoning": "análisis completo en 4-5 oraciones",
  "marketStructure": "descripción de la estructura",
  "strategies": [{"name":"","bias":"bullish","confidence":0,"entry":0,"sl":0,"tp1":0,"tp2":0,"tp3":0,"rr":"1:2","description":"","conditions":[]}],
  "orderBlocks": [{"type":"bullish","zone":"bajo-alto","strength":"strong"}],
  "keyLevels": {"supports":[],"resistances":[]},
  "indicators": {"ema":"","rsi":"","macd":"","volume":""},
  "probability": {"bullish":50,"bearish":50},
  "recommendation": "qué hacer AHORA y por qué"
}`;

  try {
    const data = await openaiPost({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }, 60000);

    if (!data?.choices?.[0]?.message?.content) throw new Error('Respuesta inválida de OpenAI');
    return JSON.parse(data.choices[0].message.content);

  } catch (error: any) {
    if (error.code === 'ECONNABORTED') throw new Error('Timeout: imagen muy grande o conexión lenta. Intenta con una imagen más pequeña.');
    if (error.response?.status === 401) throw new Error('API key inválida. Verifica tu configuración.');
    if (error.response?.status === 429) throw new Error('Límite de rate excedido. Espera unos minutos.');
    if (error.response?.status === 400) throw new Error('Imagen inválida o muy grande (máx 20MB).');
    if (error.response?.status >= 500) throw new Error('Error del servidor de OpenAI. Intenta de nuevo.');
    throw new Error(error.message || 'Error al analizar la imagen.');
  }
}

// ─── Result sub-components ────────────────────────────────────────────────────

function BiasIcon({ bias, size = 18 }: { bias: string; size?: number }) {
  if (bias === 'bullish') return <TrendingUp size={size} color="#34C759" />;
  if (bias === 'bearish') return <TrendingDown size={size} color="#FF3B30" />;
  return <Minus size={size} color="#FF9500" />;
}

function StrategyCard({ s, idx }: { s: VisionStrategy; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  const bc = s.bias === 'bullish' ? '#34C759' : s.bias === 'bearish' ? '#FF3B30' : '#FF9500';
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1C1C1E', border: `1px solid ${open ? bc + '40' : '#38383A'}` }}>
      <button className="w-full flex items-center justify-between px-4 py-3.5" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bc + '15' }}>
            <BiasIcon bias={s.bias} size={16} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{s.name}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: bc, background: bc + '20' }}>{s.confidence}%</span>
            </div>
            <span className="text-xs text-[#636366]">{s.rr} R:R</span>
          </div>
        </div>
        {open ? <ChevronUp size={15} color="#636366" /> : <ChevronDown size={15} color="#636366" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 border-t border-[#38383A] pt-3 space-y-3">
              <p className="text-xs text-[#8E8E93] leading-relaxed">{s.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl" style={{ background: '#2C2C2E' }}>
                  <div className="flex items-center gap-1 text-xs text-[#636366] mb-1"><Target size={9} /><span>Entrada</span></div>
                  <span className="text-sm font-bold text-white">{s.entry > 0 ? s.entry.toLocaleString() : 'Ver gráfico'}</span>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,59,48,0.1)' }}>
                  <div className="flex items-center gap-1 text-xs text-[#FF3B30] mb-1"><Shield size={9} /><span>Stop Loss</span></div>
                  <span className="text-sm font-bold text-[#FF3B30]">{s.sl > 0 ? s.sl.toLocaleString() : 'Ver gráfico'}</span>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(52,199,89,0.1)' }}>
                  <span className="text-xs text-[#34C759] block mb-1">TP1</span>
                  <span className="text-sm font-bold text-[#34C759]">{s.tp1 > 0 ? s.tp1.toLocaleString() : 'Ver gráfico'}</span>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(52,199,89,0.07)' }}>
                  <span className="text-xs text-[#34C759] block mb-1">TP2</span>
                  <span className="text-sm font-bold text-[#34C759]">{s.tp2 > 0 ? s.tp2.toLocaleString() : 'Ver gráfico'}</span>
                </div>
              </div>
              {s.tp3 > 0 && (
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(52,199,89,0.05)' }}>
                  <span className="text-xs text-[#34C759] block mb-1">TP3 (extensión)</span>
                  <span className="text-sm font-bold text-[#34C759]">{s.tp3.toLocaleString()}</span>
                </div>
              )}
              {s.conditions.length > 0 && (
                <div>
                  <span className="text-xs text-[#636366] block mb-2">Condiciones</span>
                  <div className="space-y-1">
                    {s.conditions.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#34C759] text-xs mt-0.5">✓</span>
                        <span className="text-xs text-[#8E8E93]">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnalysisResult({ result, onReset }: { result: VisionAnalysis; onReset: () => void }) {
  const biasColor = result.bias === 'bullish' ? '#34C759' : result.bias === 'bearish' ? '#FF3B30' : '#FF9500';
  const biasLabel = result.bias === 'bullish' ? 'ALCISTA' : result.bias === 'bearish' ? 'BAJISTA' : 'NEUTRAL';

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 md:px-8 pb-8">
      {/* Bias header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-2xl" style={{ background: '#1C1C1E', border: `1px solid ${biasColor}30` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BiasIcon bias={result.bias} size={22} />
            <span className="text-base font-bold text-white">{result.symbol !== 'Desconocido' ? result.symbol : 'Análisis'} · {result.timeframe}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ color: biasColor, background: biasColor + '20' }}>{biasLabel}</span>
            <span className="text-sm font-bold" style={{ color: biasColor }}>{result.biasStrength}%</span>
          </div>
        </div>
        {/* Probability bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
          <div className="rounded-l-full" style={{ width: `${result.probability.bullish}%`, background: '#34C759' }} />
          <div className="rounded-r-full" style={{ width: `${result.probability.bearish}%`, background: '#FF3B30' }} />
        </div>
        <div className="flex justify-between text-xs text-[#636366] mb-3">
          <span>🟢 Alcista {result.probability.bullish}%</span>
          <span>🔴 Bajista {result.probability.bearish}%</span>
        </div>
        <p className="text-sm text-[#8E8E93] leading-relaxed">{result.reasoning}</p>
      </motion.div>

      {/* Recommendation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-3 p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} color="#AF52DE" />
          <span className="text-xs font-semibold text-[#AF52DE] uppercase tracking-wider">Recomendación IA</span>
        </div>
        <p className="text-sm text-white leading-relaxed font-medium">{result.recommendation}</p>
      </motion.div>

      {/* Market Structure */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-3 p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
        <span className="text-xs font-semibold text-[#FF9500] uppercase tracking-wider block mb-2">Estructura de Mercado</span>
        <p className="text-sm text-[#8E8E93] leading-relaxed">{result.marketStructure}</p>
      </motion.div>

      {/* Strategies */}
      {result.strategies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4">
          <span className="text-sm font-bold text-white block mb-3">Estrategias Detectadas ({result.strategies.length})</span>
          <div className="space-y-2">
            {result.strategies.map((s, i) => <StrategyCard key={i} s={s} idx={i} />)}
          </div>
        </motion.div>
      )}

      {/* Order Blocks */}
      {result.orderBlocks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-4 p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
          <span className="text-xs font-semibold text-[#636366] uppercase tracking-wider block mb-3">Order Blocks Identificados</span>
          <div className="space-y-2">
            {result.orderBlocks.map((ob, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{ob.type === 'bullish' ? '🟢' : '🔴'}</span>
                  <span className="text-xs text-[#8E8E93]">OB {ob.type === 'bullish' ? 'Alcista' : 'Bajista'}</span>
                </div>
                <span className="text-xs font-medium text-white">{ob.zone}</span>
                <span className="text-xs text-[#636366]">{ob.strength}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Levels */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-3 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid rgba(52,199,89,0.3)' }}>
          <span className="text-xs font-semibold text-[#34C759] block mb-2">Soportes</span>
          {result.keyLevels.supports.map((s, i) => <div key={i} className="text-xs text-white font-medium py-0.5">{s}</div>)}
        </div>
        <div className="p-3 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid rgba(255,59,48,0.3)' }}>
          <span className="text-xs font-semibold text-[#FF3B30] block mb-2">Resistencias</span>
          {result.keyLevels.resistances.map((r, i) => <div key={i} className="text-xs text-white font-medium py-0.5">{r}</div>)}
        </div>
      </motion.div>

      {/* Indicators */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-3 p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
        <span className="text-xs font-semibold text-[#636366] uppercase tracking-wider block mb-3">Indicadores</span>
        <div className="space-y-2">
          {[
            { label: 'EMAs', value: result.indicators.ema },
            { label: 'RSI', value: result.indicators.rsi },
            { label: 'MACD', value: result.indicators.macd },
            { label: 'Volumen', value: result.indicators.volume },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <span className="text-xs text-[#636366] w-14 shrink-0">{label}</span>
              <span className="text-xs text-[#8E8E93]">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reset button */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} onClick={onReset} className="w-full mt-4 py-3.5 rounded-full text-sm font-semibold text-black bg-white active:scale-[0.98] transition-transform">
        Analizar otro gráfico
      </motion.button>

      <p className="text-xs text-[#38383A] text-center mt-4 leading-relaxed">
        Análisis generado por GPT-4o Vision. No constituye asesoramiento financiero.
      </p>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyzeScreen() {
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setCapturedImage = useStore((s) => s.setCapturedImage);
  const user = useStore((s) => s.user);

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
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);
      setCapturedImage(dataUrl);
      // Extract base64 part
      const b64 = dataUrl.split(',')[1];
      setBase64Image(b64);
    };
    reader.readAsDataURL(file);
  }, [setCapturedImage]);

  const handleGalleryClick = () => fileInputRef.current?.click();

  const handleAnalyze = async () => {
    if (!base64Image) {
      setError('No hay imagen para analizar. Por favor, sube una imagen primero.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando análisis...');
      console.log('👤 Usuario:', user ? user.email : 'No autenticado');
      
      // Pasar el perfil del usuario al análisis
      const result = await analyzeChartImage(base64Image, symbol, user);
      console.log('✅ Análisis completado:', result);
      setAnalysisResult(result);
      
      // Guardar análisis en historial si el usuario está autenticado
      if (user) {
        try {
          const { saveAnalysis } = await import('@/lib/supabase');
          await saveAnalysis(user.id, {
            asset: result.symbol || symbol || 'Desconocido',
            timeframe: result.timeframe || '1h',
            bias: result.bias,
            confidence: result.biasStrength,
            strategies: result.strategies,
            analysis_type: 'image',
          });
          console.log('✅ Análisis guardado en historial');
        } catch (historyError) {
          console.error('⚠️ Error guardando en historial:', historyError);
          // No mostrar error al usuario, el análisis ya se completó
        }
      }
    } catch (err: any) {
      console.error('❌ Error capturado en handleAnalyze:', err);
      
      // Usar el mensaje de error específico si está disponible
      const errorMessage = err.message || 'Error al analizar la imagen. Verifica tu conexión y vuelve a intentarlo.';
      setError(errorMessage);
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
          <p className="text-white font-bold text-lg">Analizando gráfico con GPT-4o</p>
          <p className="text-sm text-[#636366] mt-1">Detectando order blocks, EMAs, soportes, resistencias y estrategias...</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[#AF52DE]"
              animate={{ scale: [0, 1, 0] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
        <div className="w-full max-w-xs space-y-2 mt-2">
          {['Procesando imagen...', 'Identificando patrones...', 'Calculando niveles...', 'Generando estrategias...'].map((step, i) => (
            <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}
              className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#AF52DE]" />
              <span className="text-xs text-[#636366]">{step}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ── Result state ──
  if (analysisResult) {
    return (
      <div className="flex-1 flex flex-col bg-black">
        <div className="shrink-0 flex items-center justify-between px-6 md:px-8 py-4 md:py-5"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1C1C1E' }}>
          <button onClick={handleReset} className="p-1"><X size={22} color="#FFFFFF" /></button>
          <h3 className="text-base font-bold text-white absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            Análisis de Gráfico
          </h3>
          <button onClick={handleAnalyze} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1C1C1E' }}>
            <RefreshCw size={14} color="#8E8E93" />
          </button>
        </div>
        {/* Show image thumbnail */}
        {previewImage && (
          <div className="shrink-0 px-5 md:px-8 pt-3">
            <img src={previewImage} alt="chart" className="w-full h-32 md:h-48 object-cover rounded-2xl" />
          </div>
        )}
        <AnalysisResult result={analysisResult} onReset={handleReset} />
      </div>
    );
  }

  // ── Upload state ──
  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 md:px-8 py-4 md:py-5 md:border-b md:border-[#1C1C1E]"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
        <button onClick={handleClose} className="p-1"><X size={24} color="#FFFFFF" /></button>
        <h3 className="text-lg md:text-2xl font-semibold md:font-bold text-white absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          Analizar Gráfico
        </h3>
        <div className="w-8 md:hidden" />
      </div>

      <div className="flex-1 flex flex-col md:flex-row md:items-stretch overflow-y-auto no-scrollbar">
        {/* Preview / Drop zone */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-6 md:border-r md:border-[#1C1C1E]">
          {previewImage ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-2xl overflow-hidden relative">
              <img src={previewImage} alt="Chart preview" className="w-full h-72 md:h-96 object-cover rounded-2xl" />
              <div className="absolute inset-3 border-2 border-white/50 rounded-xl pointer-events-none" />
              <button onClick={handleReset} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                <X size={14} color="#FFFFFF" />
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full max-w-lg">
              <div className="w-16 h-16 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mx-auto mb-4">
                <Brain size={32} color="#AF52DE" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Análisis con IA</h2>
              <p className="text-sm text-[#636366] mb-6">Sube una captura de tu gráfico y GPT-4o detectará order blocks, estrategias, soportes, resistencias y más.</p>
              <div onClick={handleGalleryClick} className="w-full h-56 md:h-72 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
                style={{ background: '#1C1C1E', border: '2px dashed #38383A' }}>
                <Upload size={36} color="#38383A" />
                <div>
                  <p className="text-sm text-[#636366]">Click para subir o arrastra aquí</p>
                  <p className="text-xs text-[#38383A] mt-1">PNG, JPG, WEBP · Cualquier activo</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="shrink-0 md:w-80 px-6 md:p-8 pb-8 md:pb-8 flex flex-col justify-center gap-4">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {/* Symbol input */}
          <div>
            <label className="text-xs text-[#636366] block mb-2">Activo (opcional)</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Ej: XAU/USD, BTC, AAPL..."
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder:text-[#38383A]"
              style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
            />
          </div>

          {previewImage ? (
            <div className="flex flex-col gap-3">
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleAnalyze}
                className="w-full py-4 rounded-full font-bold text-base text-black active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
                <Brain size={18} color="#FFFFFF" />
                <span className="text-white">Analizar con GPT-4o</span>
              </motion.button>
              <button onClick={handleGalleryClick} className="w-full py-3 rounded-full text-sm font-medium text-[#8E8E93] active:scale-[0.98] transition-transform"
                style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
                Cambiar imagen
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button onClick={handleGalleryClick} className="w-full py-4 rounded-full bg-white text-black font-bold text-base hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <ImageIcon size={18} color="#000" />
                Seleccionar imagen
              </button>
              {/* Mobile shutter */}
              <div className="flex items-center justify-center gap-6 md:hidden pt-2">
                <button onClick={handleGalleryClick} className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#1C1C1E' }}>
                  <ImageIcon size={20} color="#FFFFFF" />
                </button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleGalleryClick} className="rounded-full flex items-center justify-center"
                  style={{ width: 68, height: 68, background: '#FFFFFF', border: '4px solid #38383A' }}>
                  <div className="w-14 h-14 rounded-full border-2 border-black" />
                </motion.button>
                <button className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#1C1C1E' }}>
                  <Zap size={20} color="#FFFFFF" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl" 
              style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)' }}
            >
              <div className="flex items-start gap-2">
                <span className="text-[#FF3B30] text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#FF3B30] mb-1">Error al analizar</p>
                  <p className="text-xs text-[#FF3B30] leading-relaxed">{error}</p>
                  
                  {/* Sugerencias de solución */}
                  <div className="mt-3 pt-3 border-t border-[#FF3B3030]">
                    <p className="text-xs font-semibold text-[#FF3B30] mb-2">Posibles soluciones:</p>
                    <ul className="space-y-1">
                      <li className="text-xs text-[#8E8E93] flex items-start gap-1.5">
                        <span className="text-[#FF3B30] mt-0.5">•</span>
                        <span>Verifica que tu API key de OpenAI esté configurada en el archivo .env</span>
                      </li>
                      <li className="text-xs text-[#8E8E93] flex items-start gap-1.5">
                        <span className="text-[#FF3B30] mt-0.5">•</span>
                        <span>Asegúrate de tener conexión a internet estable</span>
                      </li>
                      <li className="text-xs text-[#8E8E93] flex items-start gap-1.5">
                        <span className="text-[#FF3B30] mt-0.5">•</span>
                        <span>Intenta con una imagen más pequeña (máx 5MB)</span>
                      </li>
                      <li className="text-xs text-[#8E8E93] flex items-start gap-1.5">
                        <span className="text-[#FF3B30] mt-0.5">•</span>
                        <span>Verifica que la imagen sea un gráfico de trading válido</span>
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-xs font-medium text-[#FF3B30] underline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* What it detects */}
          <div className="hidden md:block p-4 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #38383A' }}>
            <p className="text-xs font-semibold text-[#636366] uppercase tracking-wider mb-3">GPT-4o detecta</p>
            {['Order Blocks (ICT)', 'Soportes y Resistencias', 'EMA 20/50/200', 'RSI y MACD', 'Fibonacci', 'Bollinger Bands', 'Estructura de mercado', 'Entrada, SL y 3 TPs'].map(item => (
              <div key={item} className="flex items-center gap-2 py-1">
                <span className="text-[#34C759] text-xs">✓</span>
                <span className="text-xs text-[#8E8E93]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
