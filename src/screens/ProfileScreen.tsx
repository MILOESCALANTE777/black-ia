import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Bell, Palette, Globe, Volume2, HelpCircle,
  Mail, Star, FileText, ChevronRight, BookOpen, History,
  TrendingUp, TrendingDown, Minus, Clock, Pencil, Check, X,
  Sun, Moon
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { signOut, getAnalysisHistory, updateUserProfile, type AnalysisHistory } from '@/lib/supabase';

const SETTINGS_GROUPS_STATIC = [
  { titleKey: 'account' as const, items: [{ icon: BookOpen, labelKey: 'tradingPreferences' as const }, { icon: Bell, labelKey: 'notifications' as const }] },
  { titleKey: 'support' as const, items: [{ icon: HelpCircle, labelKey: 'helpCenter' as const }, { icon: Mail, labelKey: 'contactUs' as const }, { icon: Star, labelKey: 'rateApp' as const }] },
  { titleKey: 'legal' as const, items: [{ icon: FileText, labelKey: 'privacyPolicy' as const }, { icon: FileText, labelKey: 'termsOfService' as const }] },
];

export default function ProfileScreen() {
  const navigate = useStore((s) => s.navigate);
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const t = useStore((s) => s.t);

  const isLight = theme === 'light';
  const cardBg = isLight ? '#FFFFFF' : '#1C1C1E';
  const cardBorder = isLight ? '#E5E5EA' : '#38383A';
  const textSecondary = isLight ? '#6C6C70' : '#8E8E93';
  const pageBg = isLight ? '#F5F5F7' : '#000000';
  const headerBg = isLight ? 'rgba(245,245,247,0.92)' : 'rgba(0,0,0,0.85)';
  const textPrimary = isLight ? '#1C1C1E' : '#FFFFFF';

  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (showHistory && user && history.length === 0) loadHistory();
  }, [showHistory, user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const data = await getAnalysisHistory(user.id, 10);
      setHistory(data);
    } catch (e) { console.error(e); }
    finally { setLoadingHistory(false); }
  };

  const handleSignOut = async () => {
    try { await signOut(); setUser(null); navigate('LandingScreen'); }
    catch (e) { console.error(e); }
  };

  const handleEditName = () => { setNameInput(user?.full_name || ''); setEditingName(true); };
  const handleCancelName = () => { setEditingName(false); setNameInput(''); };
  const handleSaveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateUserProfile(user.id, { full_name: nameInput.trim() });
      setUser({ ...user, full_name: nameInput.trim() });
      setEditingName(false);
    } catch (e) { console.error(e); }
    finally { setSavingName(false); }
  };

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const initials = displayName.substring(0, 2).toUpperCase();

  const getBiasIcon = (bias: string) => {
    if (bias === 'bullish') return <TrendingUp size={14} color="#34C759" />;
    if (bias === 'bearish') return <TrendingDown size={14} color="#FF3B30" />;
    return <Minus size={14} color="#FF9500" />;
  };
  const getBiasColor = (bias: string) => bias === 'bullish' ? '#34C759' : bias === 'bearish' ? '#FF3B30' : '#FF9500';
  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
    if (m < 60) return `Hace ${m} min`;
    if (h < 24) return `Hace ${h}h`;
    if (day < 7) return `Hace ${day}d`;
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: pageBg }}>
      {/* Header */}
      <div className="shrink-0 px-6 md:px-8 py-4 md:py-5"
        style={{ background: headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${cardBorder}` }}>
        <h3 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>{t('profileTitle')}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 md:px-0 pb-8">
        <div className="md:grid md:grid-cols-[320px_1fr] md:h-full">

          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div className="md:border-r md:px-8 md:py-6" style={{ borderColor: cardBorder }}>

            {/* Avatar + nombre + email */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 py-6 md:py-0 md:mb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #AF52DE, #007AFF)' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {editingName ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 mb-1">
                      <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelName(); }}
                        placeholder="Tu nombre"
                        className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none min-w-0"
                        style={{ background: cardBg, border: '1px solid #007AFF', color: textPrimary }} />
                      <button onClick={handleSaveName} disabled={savingName || !nameInput.trim()}
                        className="w-7 h-7 rounded-full bg-[#34C759] flex items-center justify-center shrink-0 disabled:opacity-50">
                        <Check size={13} color="#000" />
                      </button>
                      <button onClick={handleCancelName}
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: cardBorder }}>
                        <X size={13} color={textPrimary} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg md:text-xl font-semibold truncate" style={{ color: textPrimary }}>
                        {displayName}
                      </span>
                      <button onClick={handleEditName}
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{ background: isLight ? '#E5E5EA' : '#2C2C2E' }}>
                        <Pencil size={11} color={textSecondary} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-1.5">
                  <Mail size={12} color={textSecondary} />
                  <span className="text-sm truncate" style={{ color: textSecondary }}>{user?.email || '—'}</span>
                </div>
                {user && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34C759]/15">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                    <span className="text-xs text-[#34C759] font-medium">
                      {user.experience_level === 'expert' ? 'Elite Trader' :
                       user.experience_level === 'advanced' ? 'Advanced Trader' :
                       user.experience_level === 'intermediate' ? 'Intermediate Trader' : 'Beginner Trader'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Trading Journal */}
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onClick={() => navigate('JournalScreen')}
              className="w-full p-4 rounded-2xl flex items-center justify-between mb-3 active:scale-[0.98] transition-transform"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#34C759]/15 flex items-center justify-center">
                  <BookOpen size={20} color="#34C759" />
                </div>
                <div className="text-left">
                  <div className="text-base font-semibold" style={{ color: textPrimary }}>{t('tradingJournal')}</div>
                  <div className="text-xs" style={{ color: textSecondary }}>{t('trackPerformance')}</div>
                </div>
              </div>
              <ChevronRight size={18} color={textSecondary} />
            </motion.button>

            {/* Analysis History */}
            {user && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                onClick={() => setShowHistory(!showHistory)}
                className="w-full p-4 rounded-2xl flex items-center justify-between mb-4 active:scale-[0.98] transition-transform"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#AF52DE]/15 flex items-center justify-center">
                    <History size={20} color="#AF52DE" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-semibold" style={{ color: textPrimary }}>{t('analysisHistory')}</div>
                    <div className="text-xs" style={{ color: textSecondary }}>{user.total_analyses || 0} {t('analysesCount')}</div>
                  </div>
                </div>
                <ChevronRight size={18} color={textSecondary}
                  style={{ transform: showHistory ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </motion.button>
            )}

            {/* History list */}
            <AnimatePresence>
              {showHistory && user && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                  {loadingHistory ? (
                    <div className="p-4 flex gap-1 justify-center">
                      {[0,1,2].map((i) => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-[#AF52DE]"
                          animate={{ scale: [0,1,0] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-4 rounded-2xl text-center" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                      <p className="text-sm" style={{ color: textSecondary }}>{t('noAnalysisYet')}</p>
                      <p className="text-xs mt-1" style={{ color: isLight ? '#8E8E93' : '#636366' }}>{t('analyzeFirstChart')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getBiasIcon(item.bias)}
                              <span className="text-sm font-semibold" style={{ color: textPrimary }}>{item.asset}</span>
                            </div>
                            <span className="text-xs" style={{ color: textSecondary }}>{item.timeframe}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ color: getBiasColor(item.bias), background: getBiasColor(item.bias) + '20' }}>
                                {item.confidence}%
                              </span>
                              <span className="text-xs" style={{ color: textSecondary }}>
                                {item.bias === 'bullish' ? t('bullish') : item.bias === 'bearish' ? t('bearish') : t('neutral')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs" style={{ color: isLight ? '#8E8E93' : '#636366' }}>
                              <Clock size={10} />
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign Out — desktop */}
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              onClick={handleSignOut}
              className="hidden md:block w-full py-3 text-center text-base font-medium active:opacity-70 transition-opacity rounded-2xl"
              style={{ color: '#FF3B30', border: `1px solid ${cardBorder}` }}>
              {t('signOut')}
            </motion.button>
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────── */}
          <div className="md:px-8 md:py-6 md:overflow-y-auto">

            {/* APP: Tema + Idioma */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
              <h4 className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: textSecondary }}>
                {t('app')}
              </h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>

                {/* Tema */}
                <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <div className="flex items-center gap-3">
                    <Palette size={20} color={textSecondary} />
                    <span className="text-base" style={{ color: textPrimary }}>{t('theme')}</span>
                  </div>
                  <button onClick={() => setTheme(isLight ? 'dark' : 'light')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95"
                    style={{ background: isLight ? '#007AFF' : '#2C2C2E', border: `1px solid ${isLight ? '#007AFF' : '#38383A'}` }}>
                    {isLight ? <Sun size={14} color="#FFFFFF" /> : <Moon size={14} color="#8E8E93" />}
                    <span className="text-xs font-semibold" style={{ color: isLight ? '#FFFFFF' : '#8E8E93' }}>
                      {isLight ? t('lightTheme') : t('darkTheme')}
                    </span>
                  </button>
                </div>

                {/* Idioma */}
                <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <div className="flex items-center gap-3">
                    <Globe size={20} color={textSecondary} />
                    <span className="text-base" style={{ color: textPrimary }}>{t('language')}</span>
                  </div>
                  <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                    {(['es', 'en'] as const).map((lang) => (
                      <button key={lang} onClick={() => setLanguage(lang)}
                        className="px-3 py-1.5 text-xs font-bold transition-all"
                        style={{ background: language === lang ? '#007AFF' : 'transparent', color: language === lang ? '#FFFFFF' : textSecondary }}>
                        {lang === 'es' ? '🇲🇽 ES' : '🇺🇸 EN'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} color={textSecondary} />
                    <span className="text-base" style={{ color: textPrimary }}>{t('soundEffects')}</span>
                  </div>
                  <ChevronRight size={16} color={textSecondary} />
                </div>
              </div>
            </motion.div>

            {/* Resto de grupos */}
            {SETTINGS_GROUPS_STATIC.map((group, gi) => (
              <motion.div key={group.titleKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + gi * 0.1 }} className="mb-6">
                <h4 className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: textSecondary }}>
                  {t(group.titleKey)}
                </h4>
                <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  {group.items.map((item, ii) => (
                    <button key={item.labelKey}
                      className="flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors"
                      style={{ borderBottom: ii < group.items.length - 1 ? `1px solid ${cardBorder}` : 'none' }}>
                      <div className="flex items-center gap-3">
                        <item.icon size={20} color={textSecondary} />
                        <span className="text-base" style={{ color: textPrimary }}>{t(item.labelKey)}</span>
                      </div>
                      <ChevronRight size={16} color={textSecondary} />
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Sign Out — mobile */}
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              onClick={handleSignOut}
              className="md:hidden w-full py-3 text-center text-base font-medium active:opacity-70 transition-opacity"
              style={{ color: '#FF3B30' }}>
              {t('signOut')}
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  );
}
