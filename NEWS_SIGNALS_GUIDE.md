# 📰 Guía de Señales de Noticias - PROFIT AI

## 🎯 Descripción General

La funcionalidad de **Señales de Noticias** es un sistema avanzado de análisis de noticias financieras que utiliza GPT-4o para interpretar eventos del mercado y generar señales de trading precisas con timing exacto.

## ✨ Características Principales

### 1. **Análisis de Noticias en Tiempo Real**
- Monitoreo de noticias de las últimas 24 horas
- Filtrado inteligente por activo seleccionado
- Clasificación automática por impacto (Alto, Medio, Bajo)

### 2. **Señales de Trading Precisas**
Cada noticia analizada incluye:
- **Acción recomendada**: BUY, SELL, HOLD, WAIT
- **Timing exacto**: Inmediato, 15min, 30min, 1h, o esperar confirmación
- **Movimiento esperado**: UP, DOWN, VOLATILE, NEUTRAL
- **Ventana de entrada**: Período específico para entrar al mercado
- **Advertencia de volatilidad**: Para eventos de alto impacto

### 3. **Análisis Detallado**
Para cada noticia:
- **Resumen**: Síntesis de la noticia
- **Impacto en el mercado**: Cómo afectará al precio
- **Razonamiento**: Por qué genera esta señal específica
- **Factores clave**: 3 elementos principales a monitorear
- **Contexto histórico**: Eventos similares del pasado
- **Activos afectados**: Lista de todos los activos relacionados

### 4. **Objetivos de Precio**
- **Corto plazo**: Movimiento esperado en 1-4 horas
- **Mediano plazo**: Movimiento esperado en 24 horas
- Porcentajes específicos de movimiento

### 5. **Sentimiento General**
- Análisis agregado de todas las señales
- Conteo de señales alcistas vs bajistas
- Recomendación general de acción

## 🎨 Interfaz de Usuario

### Pantalla Principal
1. **Selector de Activos**: Barra superior con todos los activos disponibles
2. **Tarjeta de Resumen**: Muestra el sentimiento general y estadísticas
3. **Lista de Señales**: Tarjetas expandibles con cada noticia

### Tarjeta de Señal
- **Header compacto**: Título, fuente, hora exacta, badges de impacto
- **Contenido expandible**: Análisis completo al hacer clic
- **Código de colores**:
  - 🟢 Verde: Señales alcistas
  - 🔴 Rojo: Señales bajistas
  - 🟠 Naranja: Señales neutrales

## 📊 Activos Soportados

### Oro y Metales Preciosos
- **XAU/USD** (Oro)
- **XAG/USD** (Plata)

### Criptomonedas
- **BTC/USD** (Bitcoin)
- **ETH/USD** (Ethereum)

### Forex
- **EUR/USD** (Euro/Dólar)
- **GBP/USD** (Libra/Dólar)
- **USD/JPY** (Dólar/Yen)

### Acciones
- **AAPL** (Apple)
- **TSLA** (Tesla)
- **NVDA** (NVIDIA)

### Índices
- **SPX** (S&P 500)
- **DJI** (Dow Jones)
- **NDX** (Nasdaq 100)

### Commodities
- **WTI** (Petróleo)

## 🧠 Reglas de Análisis por Tipo de Activo

### Oro (XAU/USD)
**Alcista:**
- Inflación alta
- USD débil
- Crisis geopolítica
- Tasas de interés bajas
- Recesión
- Demanda de activos refugio

**Bajista:**
- USD fuerte
- Tasas de interés altas
- Fed hawkish
- NFP fuerte
- Risk-on sentiment
- Economía fuerte

**Alta Volatilidad:**
- FOMC meetings
- CPI/PPI releases
- NFP
- Discursos de Powell
- Crisis geopolíticas

### Criptomonedas
**Alcista:**
- Aprobación de ETF
- Adopción institucional
- Halving
- Regulación favorable
- Risk-on
- Inflación

**Bajista:**
- Regulación negativa (SEC)
- Hackeos
- Prohibiciones
- Fed hawkish
- Tasas altas
- Risk-off

### Forex
**Alcista (moneda base):**
- Subida de tasas del banco central
- Inflación alta
- PIB fuerte
- Empleo fuerte

**Bajista (moneda base):**
- Baja de tasas
- Economía débil
- Desempleo alto
- Banco central dovish

### Acciones
**Alcista:**
- Earnings beat
- Revenue growth
- Guidance positiva
- Buybacks
- Innovación
- Sector strength

**Bajista:**
- Earnings miss
- Guidance negativa
- Layoffs
- Competencia
- Regulación negativa

### Commodities
**Alcista:**
- Recortes de producción (OPEC)
- Demanda china fuerte
- USD débil
- Inflación
- Crisis de supply

**Bajista:**
- Aumento de producción
- Demanda débil
- USD fuerte
- Recesión
- Inventarios altos

### Índices
**Alcista:**
- Fed dovish
- Baja de tasas
- Earnings season positiva
- PIB fuerte
- Estímulos

**Bajista:**
- Fed hawkish
- Subida de tasas
- Earnings débiles
- Recesión
- Crisis geopolítica

## 🔧 Implementación Técnica

### Archivos Principales

1. **`src/lib/newsSignals.ts`**
   - Motor de análisis de noticias
   - Integración con News API
   - Análisis con GPT-4o
   - Clasificación de impacto y sentimiento

2. **`src/screens/NewsSignalsScreen.tsx`**
   - Interfaz de usuario
   - Selector de activos
   - Tarjetas de señales expandibles
   - Resumen de sentimiento

3. **`src/App.tsx`**
   - Integración de la nueva pantalla
   - Routing

4. **`src/screens/MarketsScreen.tsx`**
   - Botón de acceso rápido a señales de noticias

### APIs Utilizadas

1. **News API** (`VITE_NEWS_API_KEY`)
   - Endpoint: `/api/news/v2/everything`
   - Búsqueda de noticias por keywords
   - Filtrado por fecha (últimas 24 horas)

2. **OpenAI GPT-4o** (`VITE_OPENAI_API_KEY`)
   - Endpoint: `/api/openai/v1/chat/completions`
   - Análisis de noticias
   - Generación de señales de trading
   - Respuesta en formato JSON estructurado

## 🚀 Cómo Usar

### Desde Markets Screen
1. Abre la pantalla "Markets"
2. Haz clic en el botón "Señales de Noticias" (azul, esquina superior derecha)
3. Selecciona el activo que deseas analizar
4. Revisa las señales generadas

### Navegación Directa
1. La pantalla está disponible en `NewsSignalsScreen`
2. Se puede acceder mediante `navigate('NewsSignalsScreen')`

### Interpretación de Señales

#### Timing
- **⚡ Inmediato**: Entrar al mercado ahora mismo
- **⏱️ 15 min**: Esperar 15 minutos para confirmación
- **⏱️ 30 min**: Esperar 30 minutos para confirmación
- **⏱️ 1 hora**: Esperar 1 hora para confirmación
- **⏳ Esperar confirmación**: Esperar confirmación de precio antes de entrar

#### Impacto
- **ALTO**: Evento de alta volatilidad, impacto significativo esperado
- **MEDIO**: Impacto moderado en el precio
- **BAJO**: Impacto menor, más informativo que accionable

#### Confianza
- **90-100%**: Señal muy clara, alta probabilidad
- **70-89%**: Señal clara, buena probabilidad
- **50-69%**: Señal moderada, requiere confirmación
- **<50%**: Señal débil, esperar más información

## ⚠️ Advertencias Importantes

1. **No es asesoramiento financiero**: Las señales son generadas por IA y deben usarse como herramienta de análisis, no como recomendación de inversión.

2. **Volatilidad**: Las noticias de alto impacto pueden generar movimientos bruscos. Usa stops loss apropiados.

3. **Confirmación de precio**: Siempre espera confirmación de precio antes de entrar, especialmente en señales con timing "WAIT_CONFIRMATION".

4. **Gestión de riesgo**: No arriesgues más del 1-2% de tu capital en una sola operación.

5. **Contexto técnico**: Combina las señales de noticias con análisis técnico para mejores resultados.

## 🔄 Actualización de Datos

- Las señales se actualizan automáticamente al cambiar de activo
- Botón de refresh manual disponible en la esquina superior derecha
- Las noticias se filtran a las últimas 24 horas

## 📈 Mejores Prácticas

1. **Combina con análisis técnico**: Usa las señales junto con soportes, resistencias y patrones de precio

2. **Monitorea múltiples activos**: Las noticias pueden afectar a varios activos correlacionados

3. **Presta atención al timing**: Respeta las ventanas de entrada sugeridas

4. **Lee el contexto histórico**: Aprende de eventos similares del pasado

5. **Verifica los factores clave**: Monitorea los 3 factores principales mencionados en cada señal

## 🎯 Casos de Uso

### Trader Intraday
- Usa señales con timing "IMMEDIATE" o "WAIT_15MIN"
- Enfócate en noticias de alto impacto
- Monitorea objetivos de corto plazo

### Swing Trader
- Usa señales con timing "WAIT_1H" o "WAIT_CONFIRMATION"
- Enfócate en el sentimiento general
- Monitorea objetivos de mediano plazo

### Trader de Noticias
- Activa notificaciones para eventos de alto impacto
- Prepara órdenes antes de releases importantes
- Usa stops loss amplios para volatilidad

## 🔮 Futuras Mejoras

- [ ] Notificaciones push para señales de alto impacto
- [ ] Historial de señales y performance tracking
- [ ] Filtros avanzados (solo alto impacto, solo alcistas, etc.)
- [ ] Integración con calendario económico
- [ ] Alertas personalizadas por activo
- [ ] Backtesting de señales históricas

## 📞 Soporte

Para preguntas o problemas con las señales de noticias, verifica:
1. Que las API keys estén configuradas correctamente
2. Que tengas conexión a internet
3. Que las APIs de News y OpenAI estén operativas

---

**Desarrollado con ❤️ por PROFIT AI**
