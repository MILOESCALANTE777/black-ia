# 🚀 Deployment en Render.com - PROFIT AI

## 📋 Pasos para Actualizar en Render

### 1. Hacer commit y push de los cambios

```bash
# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "feat: Añadir señales de noticias y mejorar analizador de imágenes"

# Push a tu repositorio
git push origin main
```

### 2. Configurar Variables de Entorno en Render

**IMPORTANTE:** Render necesita las API keys configuradas en su dashboard.

1. Ve a tu servicio en Render: https://dashboard.render.com
2. Selecciona tu servicio `trading-ai-app`
3. Ve a **Environment** en el menú lateral
4. Agrega estas variables (si no están ya):

```
VITE_OPENAI_API_KEY=tu-api-key-aqui

VITE_TWELVE_DATA_API_KEY=tu-api-key-aqui

VITE_NEWS_API_KEY=tu-api-key-aqui

NODE_ENV=production

PORT=4000
```

5. Click en **Save Changes**

### 3. Trigger Manual Deploy (Opcional)

Si Render no detecta automáticamente el push:

1. Ve a tu servicio en Render
2. Click en **Manual Deploy** → **Deploy latest commit**
3. Espera a que termine el build (5-10 minutos)

### 4. Verificar el Deployment

Una vez que el deploy termine:

1. Ve a la URL de tu app (ej: `https://trading-ai-app.onrender.com`)
2. Abre la consola del navegador (F12)
3. Ve a "Analyze"
4. Sube una imagen
5. Verifica los logs en la consola

## 🔍 Verificar que las Variables Estén Configuradas

En la consola del navegador, ejecuta:

```javascript
console.log('OpenAI:', import.meta.env.VITE_OPENAI_API_KEY ? '✅' : '❌');
console.log('Twelve:', import.meta.env.VITE_TWELVE_DATA_API_KEY ? '✅' : '❌');
console.log('News:', import.meta.env.VITE_NEWS_API_KEY ? '✅' : '❌');
```

Deberías ver:
```
OpenAI: ✅
Twelve: ✅
News: ✅
```

## 🐛 Troubleshooting

### Problema: "API key no configurada"

**Causa:** Las variables de entorno no están configuradas en Render

**Solución:**
1. Ve a Render Dashboard → Environment
2. Verifica que las 3 API keys estén agregadas
3. Asegúrate de que empiecen con `VITE_`
4. Haz un redeploy manual

### Problema: "502 Bad Gateway"

**Causa:** El servidor no está corriendo o hay un error en el build

**Solución:**
1. Ve a Render Dashboard → Logs
2. Busca errores en el build
3. Verifica que `npm run build` funcione localmente
4. Verifica que `server.js` esté correcto

### Problema: El análisis de imágenes no funciona

**Causa:** El proxy no está funcionando correctamente

**Solución:**
1. Verifica los logs del servidor en Render
2. Busca errores de proxy
3. Verifica que la API key de OpenAI sea válida
4. Prueba la API key manualmente:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer TU_API_KEY"
   ```

### Problema: Las señales de noticias no cargan

**Causa:** API key de News API inválida o límite excedido

**Solución:**
1. Verifica tu plan en https://newsapi.org/account
2. Verifica que no hayas excedido el límite (100 requests/día en plan gratuito)
3. Si es necesario, actualiza a un plan de pago

## 📊 Monitoreo

### Ver Logs en Tiempo Real

1. Ve a Render Dashboard
2. Selecciona tu servicio
3. Click en **Logs** en el menú lateral
4. Verás los logs en tiempo real

### Logs importantes a buscar:

```
✅ Server running on port 4000
✅ [OpenAI proxy] Request successful
✅ [TwelveData proxy] Request successful
✅ [NewsAPI proxy] Request successful

❌ [OpenAI proxy error] ...
❌ [TwelveData proxy error] ...
❌ [NewsAPI proxy error] ...
```

## 🔄 Proceso de Build en Render

Cuando haces push, Render automáticamente:

1. **Detecta el cambio** en tu repositorio
2. **Clona** el código
3. **Instala dependencias**: `npm install`
4. **Construye el frontend**: `npm run build`
   - Vite compila React + TypeScript
   - Genera archivos estáticos en `/dist`
   - Inyecta las variables de entorno `VITE_*`
5. **Inicia el servidor**: `npm start`
   - Express sirve los archivos estáticos
   - Configura los proxies para las APIs
6. **Publica** en tu URL

## 📁 Estructura en Producción

```
/
├── dist/                    # Frontend compilado (servido por Express)
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.js    # JavaScript compilado
│   │   └── index-xxx.css   # CSS compilado
│   └── ...
├── server.js               # Servidor Express con proxies
├── package.json
└── node_modules/
```

## 🌐 URLs de la App

### Frontend
```
https://trading-ai-app.onrender.com
```

### API Proxies (usados internamente)
```
https://trading-ai-app.onrender.com/api/openai/*
https://trading-ai-app.onrender.com/api/twelve/*
https://trading-ai-app.onrender.com/api/news/*
https://trading-ai-app.onrender.com/api/yahoo/*
```

## ✅ Checklist Pre-Deploy

Antes de hacer push, verifica:

- [ ] `npm run build` funciona localmente sin errores
- [ ] Las 3 API keys están en el archivo `.env` local
- [ ] El archivo `.gitignore` incluye `.env` (no subir keys al repo)
- [ ] `server.js` tiene los proxies configurados
- [ ] `render.yaml` está actualizado
- [ ] Hiciste commit de todos los cambios

## 🎯 Nuevas Funcionalidades Incluidas

### 1. Señales de Noticias
- Pantalla: `NewsSignalsScreen`
- Ruta: `/api/news/*`
- Activos: 14 (Oro, Bitcoin, Forex, Acciones, etc.)

### 2. Analizador de Imágenes Mejorado
- Mejor manejo de errores
- Mensajes específicos
- Logging detallado
- Timeout aumentado a 60s

### 3. Documentación
- `NEWS_SIGNALS_GUIDE.md`
- `CONFIGURACION_API_KEYS.md`
- `SOLUCION_ANALIZADOR_IMAGENES.md`

## 🔐 Seguridad

### Variables de Entorno

**NUNCA** hagas commit de las API keys en el código. Siempre usa variables de entorno:

```javascript
// ✅ CORRECTO
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// ❌ INCORRECTO
const OPENAI_KEY = 'sk-proj-xxxxx';
```

### .gitignore

Verifica que `.env` esté en `.gitignore`:

```
.env
.env.local
.env.production
```

## 📞 Soporte

Si tienes problemas con el deployment:

1. **Revisa los logs** en Render Dashboard
2. **Verifica las variables** de entorno
3. **Prueba localmente** con `npm run build && npm start`
4. **Verifica las API keys** en las respectivas plataformas

## 🎉 Después del Deploy

Una vez que el deploy esté completo:

1. ✅ Abre la app en el navegador
2. ✅ Prueba el analizador de imágenes
3. ✅ Prueba las señales de noticias
4. ✅ Verifica que no haya errores en la consola
5. ✅ Comparte la URL con tus usuarios

---

## 🚀 Comando Rápido para Deploy

```bash
# Todo en uno
git add . && \
git commit -m "feat: Actualizar app con nuevas funcionalidades" && \
git push origin main

# Render detectará el push y hará el deploy automáticamente
```

---

**¡Listo para producción!** 🎊
