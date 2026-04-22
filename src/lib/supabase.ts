import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';

const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_URL !== '' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== '' &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { isSupabaseConfigured };

// Types para la base de datos
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  
  // Onboarding data
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  trading_style: 'scalper' | 'day_trader' | 'swing_trader' | 'position_trader';
  preferred_markets: string[]; // ['forex', 'crypto', 'stocks', 'commodities']
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  trading_goals: string; // Texto libre
  
  // Preferencias de análisis
  preferred_timeframes: string[]; // ['15min', '1h', '4h', '1day']
  max_risk_per_trade: number; // Porcentaje (1-5%)
  preferred_rr_ratio: number; // 1:2, 1:3, etc.
  
  // Estadísticas
  total_analyses: number;
  favorite_assets: string[];
  
  // Configuración
  notifications_enabled: boolean;
  theme: 'dark' | 'light';
}

export interface AnalysisHistory {
  id: string;
  user_id: string;
  created_at: string;
  
  // Datos del análisis
  asset: string;
  timeframe: string;
  image_url?: string;
  
  // Resultado
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  strategies: any; // JSON con las estrategias
  
  // Metadata
  analysis_type: 'image' | 'news' | 'quant';
}

// Funciones de autenticación
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Funciones de perfil
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

export async function createUserProfile(userId: string, email: string, profileData: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_analyses: 0,
      favorite_assets: [],
      notifications_enabled: true,
      theme: 'dark',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Funciones de historial
export async function saveAnalysis(userId: string, analysis: Omit<AnalysisHistory, 'id' | 'user_id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('analysis_history')
    .insert({
      user_id: userId,
      ...analysis,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Incrementar contador de análisis
  await supabase.rpc('increment_analyses', { user_id: userId });
  
  return data;
}

export async function getAnalysisHistory(userId: string, limit = 20): Promise<AnalysisHistory[]> {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }
  
  return data || [];
}

// Funciones de favoritos
export async function addFavoriteAsset(userId: string, asset: string) {
  const profile = await getUserProfile(userId);
  if (!profile) return;
  
  const favorites = profile.favorite_assets || [];
  if (!favorites.includes(asset)) {
    favorites.push(asset);
    await updateUserProfile(userId, { favorite_assets: favorites });
  }
}

export async function removeFavoriteAsset(userId: string, asset: string) {
  const profile = await getUserProfile(userId);
  if (!profile) return;
  
  const favorites = (profile.favorite_assets || []).filter(a => a !== asset);
  await updateUserProfile(userId, { favorite_assets: favorites });
}
