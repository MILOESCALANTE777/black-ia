import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Brain, Zap, Trash2 } from 'lucide-react';
import { openaiPost } from '@/lib/openai';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  loading?: boolean;
}

const quickPrompts = [
  'Analiza XAU/USD ahora',
  'Mejor setup del día',
  'Revisa mi riesgo',
  'Outlook del mercado',
  'Explica order blocks',
  'Estrategia para SP500',
];

const SYSTEM_PROMPT = `Eres un asistente experto en trading e inversiones llamado "AI Brain". Tienes conocimiento profundo en:
- Análisis técnico: order blocks (ICT), soportes/resistencias, EMAs, RSI, MACD, Bollinger Bands, Fibonacci
- Análisis fundamental: impacto de noticias macro (Fed, CPI, NFP, PIB) en activos
- Gestión de riesgo: position sizing, stop loss, take profit, ratio R:R
- Mercados: Forex (XAU/USD, EUR/USD, GBP/USD), Cripto (BTC, ETH), Índices (SP500, Nasdaq, Dow Jones), Acciones
- Estrategias cuantitativas: mean reversion, momentum, detección de anomalías estadísticas
- Modelo Statistical Edge Reversion: BB(20,2) + RSI extremo + volumen anómalo >150% MA20

Responde siempre en español, de forma concisa y accionable. Cuando des señales incluye: dirección (LONG/SHORT), entrada, stop loss y take profit. Usa emojis con moderación para hacer las respuestas más legibles.`;

async function askGPT(messages: { role: string; content: string }[]): Promise<string> {
  const data = await openaiPost({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.4,
    max_tokens: 600,
  }, 30000);
  return data.choices[0].message.content;
}

const INITIAL_MESSAGE: Message = {
  id: 0,
  text: '¡Hola! Soy tu asistente de trading con IA. Puedo analizar activos, darte setups, revisar tu gestión de riesgo y mucho más. ¿En qué te ayudo hoy?',
  sender: 'ai',
};

export default function AIBrainScreen() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Build conversation history for GPT (exclude loading messages)
    const history = [...messages, userMsg]
      .filter(m => !m.loading)
      .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

    try {
      const response = await askGPT(history);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'ai' }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Lo siento, no pude conectarme con la IA en este momento. Verifica tu conexión e intenta de nuevo.',
        sender: 'ai',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setShowClearConfirm(false);
    setIsTyping(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-black md:flex-row">

      {/* Desktop sidebar panel */}
      <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#1C1C1E] p-5">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(175,82,222,0.2)' }}>
            <Brain size={20} color="#AF52DE" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">AI Brain</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span className="text-xs text-[#8E8E93]">Online</span>
            </div>
          </div>
          {messages.length > 1 && (
            <button onClick={() => setShowClearConfirm(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#2C2C2E] transition-colors"
              title="Borrar conversación">
              <Trash2 size={14} color="#636366" />
            </button>
          )}
        </div>

        <p className="text-xs text-[#636366] mb-5">Quick prompts to get started:</p>
        <div className="flex flex-col gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isTyping}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#8E8E93] bg-[#1C1C1E] border border-[#38383A] hover:bg-[#2C2C2E] hover:text-white transition-all text-left disabled:opacity-40"
            >
              <Zap size={14} color="#636366" />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <div
          className="shrink-0 flex items-center gap-3 px-6 py-4 md:px-8 md:py-5 md:border-b md:border-[#1C1C1E]"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center md:hidden" style={{ background: 'rgba(175,82,222,0.2)' }}>
            <Brain size={20} color="#AF52DE" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white md:text-2xl md:font-bold">AI Brain</h3>
            <div className="flex items-center gap-1.5 md:hidden">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span className="text-xs text-[#8E8E93]">Online</span>
            </div>
          </div>
          {/* Clear chat button */}
          {messages.length > 1 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: '#1C1C1E', border: '1px solid #38383A' }}
            >
              <Trash2 size={15} color="#636366" />
            </button>
          )}
        </div>

        {/* Clear confirm banner */}
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 flex items-center justify-between px-5 py-3 mx-4 mt-2 rounded-2xl"
            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)' }}
          >
            <span className="text-sm text-white">¿Borrar toda la conversación?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#8E8E93]"
                style={{ background: '#2C2C2E' }}
              >
                Cancelar
              </button>
              <button
                onClick={clearChat}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: '#FF3B30' }}
              >
                Borrar
              </button>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 md:px-8 py-4 space-y-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#007AFF] text-white rounded-br-md'
                    : 'bg-[#1C1C1E] text-white rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#1C1C1E] flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-[#636366]"
                    animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Mobile Quick Prompts */}
        {messages.length <= 2 && (
          <div className="shrink-0 px-4 pb-2 md:hidden">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-[#1C1C1E] text-[#8E8E93] border border-[#38383A] active:bg-[#2C2C2E] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 border-t border-[#1C1C1E]">
          <div className="flex-1 flex items-center bg-[#1C1C1E] rounded-full px-4 py-2.5 border border-[#38383A]">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
              placeholder={isTyping ? 'AI está respondiendo...' : 'Pregunta sobre cualquier activo...'}
              disabled={isTyping}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#636366] disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => sendMessage(inputText)}
            disabled={isTyping || !inputText.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-40"
            style={{ background: isTyping || !inputText.trim() ? '#1C1C1E' : '#007AFF' }}
          >
            {isTyping ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Brain size={16} color="#636366" />
              </motion.div>
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
