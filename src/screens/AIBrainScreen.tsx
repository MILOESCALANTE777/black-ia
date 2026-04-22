import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Brain, Zap, Trash2 } from 'lucide-react';
import { openaiPost } from '@/lib/openai';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
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

Responde siempre en español, de forma concisa y accionable. Cuando des señales incluye: dirección (LONG/SHORT), entrada, stop loss y take profit.`;

async function askGPT(messages: { role: string; content: string }[]): Promise<string> {
  const data = await openaiPost({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
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
    const history = [...messages, userMsg].map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));
    try {
      const response = await askGPT(history);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'ai' }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Lo siento, no pude conectarme con la IA. Verifica tu conexión e intenta de nuevo.',
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
    <div className="flex-1 flex flex-col theme-bg-app md:flex-row">

      {/* ── Sidebar desktop ── */}
      <div className="hidden md:flex flex-col w-64 shrink-0 p-5"
        style={{ borderRight: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(175,82,222,0.15)' }}>
            <Brain size={20} color="#AF52DE" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>AI Brain</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Online</span>
            </div>
          </div>
          {messages.length > 1 && (
            <button onClick={() => setShowClearConfirm(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-card-2)' }}>
              <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Quick prompts:</p>
        <div className="flex flex-col gap-2">
          {quickPrompts.map((prompt) => (
            <button key={prompt} onClick={() => sendMessage(prompt)} disabled={isTyping}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left disabled:opacity-40 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Zap size={14} style={{ color: 'var(--text-muted)' }} />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-4 md:px-8 md:py-5 theme-bg-nav"
          style={{ backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center md:hidden"
            style={{ background: 'rgba(175,82,222,0.15)' }}>
            <Brain size={20} color="#AF52DE" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold md:text-2xl md:font-bold"
              style={{ color: 'var(--text-primary)' }}>AI Brain</h3>
            <div className="flex items-center gap-1.5 md:hidden">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Online</span>
            </div>
          </div>
          {messages.length > 1 && (
            <button onClick={() => setShowClearConfirm(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <Trash2 size={15} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* Clear confirm */}
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="shrink-0 flex items-center justify-between px-5 py-3 mx-4 mt-2 rounded-2xl"
            style={{ background: 'rgba(215,0,21,0.1)', border: '1px solid rgba(215,0,21,0.25)' }}>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>¿Borrar toda la conversación?</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'var(--bg-card-2)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
              <button onClick={clearChat}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: 'var(--red)' }}>
                Borrar
              </button>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 md:px-8 py-4 space-y-3">
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] md:max-w-[65%] px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: msg.sender === 'user' ? 'var(--blue)' : 'var(--bg-card)',
                  color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                }}>
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="px-4 py-3 flex items-center gap-1.5"
                style={{ background: 'var(--bg-card)', borderRadius: '18px 18px 18px 4px' }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--text-muted)' }}
                    animate={{ scale: [0.6,1,0.6], opacity: [0.4,1,0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Mobile quick prompts */}
        {messages.length <= 2 && (
          <div className="shrink-0 px-4 pb-2 md:hidden">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt) => (
                <button key={prompt} onClick={() => sendMessage(prompt)}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 px-4 md:px-8 py-3 md:py-4 flex items-center gap-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex-1 flex items-center rounded-full px-4 py-2.5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <input ref={inputRef} type="text" value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
              placeholder={isTyping ? 'AI está respondiendo...' : 'Pregunta sobre cualquier activo...'}
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
              style={{ color: 'var(--text-primary)' }} />
          </div>
          <button onClick={() => sendMessage(inputText)} disabled={isTyping || !inputText.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-40"
            style={{ background: isTyping || !inputText.trim() ? 'var(--bg-card)' : 'var(--blue)' }}>
            {isTyping
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Brain size={16} style={{ color: 'var(--text-muted)' }} />
                </motion.div>
              : <Send size={18} color="#FFFFFF" />}
          </button>
        </div>

      </div>
    </div>
  );
}
