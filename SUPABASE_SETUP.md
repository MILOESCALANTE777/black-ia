# 🗄️ Configuración de Supabase - PROFIT AI

## 📋 Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Click en "Start your project"
3. Crea una cuenta o inicia sesión
4. Click en "New Project"
5. Completa:
   - **Name:** profit-ai
   - **Database Password:** (guarda esto, lo necesitarás)
   - **Region:** Elige el más cercano a tus usuarios
6. Click en "Create new project"
7. Espera 2-3 minutos mientras se crea

---

## 📊 Paso 2: Crear Tablas en la Base de Datos

### 2.1 Ir al SQL Editor

1. En el menú lateral, click en "SQL Editor"
2. Click en "New query"
3. Copia y pega el siguiente SQL:

```sql
-- ============================================
-- TABLA: profiles
-- Almacena el perfil completo del usuario
-- ============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
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
  theme TEXT CHECK (theme IN ('dark', 'light')) DEFAULT 'dark'
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLA: analysis_history
-- Almacena el historial de análisis
-- ============================================

CREATE TABLE analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Datos del análisis
  asset TEXT NOT NULL,
  timeframe TEXT,
  image_url TEXT,
  
  -- Resultado
  bias TEXT CHECK (bias IN ('bullish', 'bearish', 'neutral')),
  confidence NUMERIC,
  strategies JSONB,
  
  -- Metadata
  analysis_type TEXT CHECK (analysis_type IN ('image', 'news', 'quant'))
);

-- Habilitar Row Level Security
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio historial
CREATE POLICY "Users can view own history"
  ON analysis_history FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar su propio historial
CREATE POLICY "Users can insert own history"
  ON analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índices para mejorar performance
CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX idx_analysis_history_created_at ON analysis_history(created_at DESC);
CREATE INDEX idx_analysis_history_asset ON analysis_history(asset);

-- ============================================
-- FUNCIÓN: Incrementar contador de análisis
-- ============================================

CREATE OR REPLACE FUNCTION increment_analyses(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET total_analyses = total_analyses + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Crear perfil automáticamente
-- cuando se registra un nuevo usuario
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click en "Run" (o presiona Cmd/Ctrl + Enter)
5. Deberías ver "Success. No rows returned"

---

## 🔑 Paso 3: Obtener las API Keys

1. En el menú lateral, click en "Project Settings" (ícono de engranaje)
2. Click en "API" en el menú lateral
3. Verás dos keys importantes:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```

### anon/public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. **COPIA ESTAS DOS KEYS** - las necesitarás en el siguiente paso

---

## 🔧 Paso 4: Configurar Variables de Entorno

### 4.1 Local (.env)

Agrega estas líneas a tu archivo `.env`:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (ya existente)
VITE_OPENAI_API_KEY=sk-...

# Twelve Data (ya existente)
VITE_TWELVE_DATA_API_KEY=...

# News API (ya existente)
VITE_NEWS_API_KEY=...
```

### 4.2 Render.com

En tu dashboard de Render, agrega estas 2 nuevas variables:

```
Key: VITE_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co

Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Paso 5: Verificar que Funciona

### 5.1 Reiniciar el servidor local

```bash
npm run dev
```

### 5.2 Probar el registro

1. Abre la app
2. Deberías ver la pantalla de login/registro
3. Crea una cuenta de prueba
4. Completa el onboarding
5. Verifica que llegues al home

### 5.3 Verificar en Supabase

1. Ve a Supabase Dashboard
2. Click en "Table Editor"
3. Selecciona la tabla "profiles"
4. Deberías ver tu perfil creado

---

## 📊 Estructura de Datos

### Tabla: profiles

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID del usuario (referencia a auth.users) |
| email | TEXT | Email del usuario |
| experience_level | TEXT | beginner, intermediate, advanced, expert |
| trading_style | TEXT | scalper, day_trader, swing_trader, position_trader |
| preferred_markets | TEXT[] | ['forex', 'crypto', 'stocks', 'commodities'] |
| risk_tolerance | TEXT | conservative, moderate, aggressive |
| trading_goals | TEXT | Objetivos del usuario |
| preferred_timeframes | TEXT[] | ['15min', '1h', '4h', '1day'] |
| max_risk_per_trade | NUMERIC | Porcentaje (1-5%) |
| preferred_rr_ratio | NUMERIC | 1:2, 1:3, etc. |
| total_analyses | INTEGER | Contador de análisis realizados |
| favorite_assets | TEXT[] | Lista de activos favoritos |
| notifications_enabled | BOOLEAN | Si tiene notificaciones activas |
| theme | TEXT | dark o light |

### Tabla: analysis_history

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único del análisis |
| user_id | UUID | ID del usuario |
| created_at | TIMESTAMP | Fecha y hora del análisis |
| asset | TEXT | Activo analizado (ej: XAU/USD) |
| timeframe | TEXT | Temporalidad (ej: 1h) |
| image_url | TEXT | URL de la imagen (opcional) |
| bias | TEXT | bullish, bearish, neutral |
| confidence | NUMERIC | Nivel de confianza (0-100) |
| strategies | JSONB | JSON con las estrategias generadas |
| analysis_type | TEXT | image, news, quant |

---

## 🔐 Seguridad (Row Level Security)

Supabase usa RLS (Row Level Security) para proteger los datos:

- ✅ Los usuarios solo pueden ver su propio perfil
- ✅ Los usuarios solo pueden actualizar su propio perfil
- ✅ Los usuarios solo pueden ver su propio historial
- ✅ Los usuarios no pueden ver datos de otros usuarios

---

## 🎯 Funcionalidades Habilitadas

Con esta configuración, la app ahora puede:

1. ✅ **Registro de usuarios** con email y contraseña
2. ✅ **Login** con autenticación segura
3. ✅ **Onboarding personalizado** que guarda el perfil
4. ✅ **Análisis personalizados** según el perfil del usuario
5. ✅ **Historial de análisis** guardado en la nube
6. ✅ **Favoritos** para acceso rápido
7. ✅ **Estadísticas** de uso

---

## 🐛 Troubleshooting

### Error: "Invalid API key"

**Solución:** Verifica que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctamente configuradas.

### Error: "Row Level Security policy violation"

**Solución:** Asegúrate de haber ejecutado todas las políticas de RLS en el SQL Editor.

### Error: "relation 'profiles' does not exist"

**Solución:** Ejecuta el SQL del Paso 2 nuevamente.

### No se crea el perfil automáticamente

**Solución:** Verifica que el trigger `on_auth_user_created` esté creado correctamente.

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en la consola del navegador (F12)
2. Revisa los logs en Supabase Dashboard → Logs
3. Verifica que las tablas existan en Table Editor
4. Verifica que las políticas de RLS estén activas

---

## 🎉 ¡Listo!

Ahora tu app tiene:
- ✅ Autenticación completa
- ✅ Base de datos en la nube
- ✅ Perfiles de usuario
- ✅ Análisis personalizados
- ✅ Historial guardado

**¡Todo listo para deployar!** 🚀
