# 🔧 CREAR TABLAS EN SUPABASE

## ✅ Variables Configuradas

Ya tienes las variables de entorno configuradas:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY

---

## 📋 AHORA: Crear las Tablas (5 minutos)

### Paso 1: Ir al SQL Editor

1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto **irakfezigymxnwjesxyu**
3. En el menú izquierdo, busca el icono **</> SQL Editor**
4. Click en **"New query"**

### Paso 2: Copiar y Pegar este SQL

Copia TODO este código y pégalo en el editor:

```sql
-- ============================================
-- PROFIT AI - Configuración de Base de Datos
-- ============================================

-- 1. CREAR TABLA DE PERFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Onboarding data
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  trading_style TEXT CHECK (trading_style IN ('scalper', 'day_trader', 'swing_trader', 'position_trader')),
  preferred_markets TEXT[] DEFAULT '{}',
  risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  trading_goals TEXT,
  
  -- Preferencias de análisis
  preferred_timeframes TEXT[] DEFAULT '{}',
  max_risk_per_trade NUMERIC DEFAULT 2,
  preferred_rr_ratio NUMERIC DEFAULT 2,
  
  -- Estadísticas
  total_analyses INTEGER DEFAULT 0,
  favorite_assets TEXT[] DEFAULT '{}',
  
  -- Configuración
  notifications_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'dark'
);

-- 2. CREAR TABLA DE HISTORIAL DE ANÁLISIS
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Datos del análisis
  asset TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  image_url TEXT,
  
  -- Resultado
  bias TEXT CHECK (bias IN ('bullish', 'bearish', 'neutral')) NOT NULL,
  confidence NUMERIC NOT NULL,
  strategies JSONB,
  
  -- Metadata
  analysis_type TEXT CHECK (analysis_type IN ('image', 'news', 'quant')) NOT NULL
);

-- 3. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX idx_analysis_history_created_at ON analysis_history(created_at DESC);

-- 4. FUNCIÓN PARA INCREMENTAR CONTADOR DE ANÁLISIS
CREATE OR REPLACE FUNCTION increment_analyses(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET total_analyses = total_analyses + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ACTIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS DE SEGURIDAD PARA PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 7. POLÍTICAS DE SEGURIDAD PARA ANALYSIS_HISTORY
CREATE POLICY "Users can view own analysis"
  ON analysis_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis"
  ON analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ✅ LISTO! Las tablas están creadas
-- ============================================
```

### Paso 3: Ejecutar

1. Click en el botón **"Run"** (o presiona `Ctrl + Enter`)
2. Espera unos segundos
3. Deberías ver: **"Success. No rows returned"**

### Paso 4: Verificar

1. Ve a **Table Editor** (icono de tabla en el menú izquierdo)
2. Deberías ver 2 tablas nuevas:
   - ✅ `profiles`
   - ✅ `analysis_history`

---

## ✅ Después de Crear las Tablas

Una vez que veas las tablas creadas, regresa aquí y dime:

**"Listo, las tablas están creadas"**

Y continuamos con:
1. Probar localmente
2. Deployar a Render

---

## ❓ Si Hay Algún Error

**Error: "relation already exists"**
→ Las tablas ya existen, todo bien ✅

**Error: "permission denied"**
→ Verifica que estés en el proyecto correcto

**Error: otro**
→ Copia el error completo y pégalo aquí

---

## 🎯 Resumen

1. ✅ Variables de entorno configuradas
2. ⚠️ Crear tablas en Supabase (hazlo ahora)
3. ⏳ Probar localmente
4. ⏳ Deployar

**Ve a Supabase y ejecuta el SQL** 👆
