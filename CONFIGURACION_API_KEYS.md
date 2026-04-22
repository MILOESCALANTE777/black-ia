# 🔑 Configuración de API Keys - PROFIT AI

## 📋 APIs Requeridas

Para que todas las funcionalidades de PROFIT AI funcionen correctamente, necesitas configurar las siguientes API keys:

### 1. OpenAI API (GPT-4o) - **REQUERIDA**
- **Uso**: Análisis de gráficos con visión, análisis de noticias, razonamiento de IA
- **Costo**: Pay-as-you-go (aproximadamente $0.01-0.05 por análisis)
- **Obtener**: https://platform.openai.com/api-keys

### 2. Twelve Data API - **REQUERIDA**
- **Uso**: Datos de mercado en tiempo real, velas, precios
- **Costo**: Plan gratuito disponible (800 requests/día)
- **Obtener**: https://twelvedata.com/

### 3. News API - **REQUERIDA**
- **Uso**: Noticias financieras para señales de trading
- **Costo**: Plan gratuito disponible (100 requests/día)
- **Obtener**: https://newsapi.org/

## 🛠️ Configuración

### Paso 1: Crear archivo .env

En la raíz del proyecto, crea un archivo llamado `.env` (si no existe):

```bash
touch .env
```

### Paso 2: Agregar las API Keys

Abre el archivo `.env` y agrega las siguientes líneas:

```env
# OpenAI API Key (GPT-4o)
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twelve Data API Key
VITE_TWELVE_DATA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# News API Key
VITE_NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:**
- Reemplaza las `x` con tus API keys reales
- NO compartas estas keys públicamente
- NO las subas a GitHub (el archivo `.env` está en `.gitignore`)
- Las variables DEBEN empezar con `VITE_` para que Vite las reconozca

### Paso 3: Reiniciar el servidor

Después de agregar las keys, reinicia el servidor de desarrollo:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

## 🔍 Verificar Configuración

### Método 1: Consola del navegador

1. Abre la aplicación en el navegador
2. Abre las DevTools (F12)
3. Ve a la pestaña "Console"
4. Intenta analizar una imagen
5. Verás logs como:
   ```
   🔍 Iniciando análisis de imagen...
   🔑 API Key configurada: Sí
   ✅ Respuesta recibida de OpenAI
   ✅ Análisis completado exitosamente
   ```

### Método 2: Verificar variables de entorno

Agrega este código temporal en cualquier componente:

```typescript
console.log('OpenAI Key:', import.meta.env.VITE_OPENAI_API_KEY ? 'Configurada ✅' : 'NO configurada ❌');
console.log('Twelve Data Key:', import.meta.env.VITE_TWELVE_DATA_API_KEY ? 'Configurada ✅' : 'NO configurada ❌');
console.log('News API Key:', import.meta.env.VITE_NEWS_API_KEY ? 'Configurada ✅' : 'NO configurada ❌');
```

## 🚨 Solución de Problemas

### Error: "API key de OpenAI no configurada"

**Causa**: La variable `VITE_OPENAI_API_KEY` no está en el archivo `.env` o no empieza con `VITE_`

**Solución**:
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que la variable se llama exactamente `VITE_OPENAI_API_KEY`
3. Verifica que no hay espacios antes o después del `=`
4. Reinicia el servidor de desarrollo

### Error: "API key inválida"

**Causa**: La API key es incorrecta o ha expirado

**Solución**:
1. Ve a https://platform.openai.com/api-keys
2. Verifica que la key es válida
3. Si es necesario, genera una nueva key
4. Actualiza el archivo `.env`
5. Reinicia el servidor

### Error: "Límite de rate excedido"

**Causa**: Has excedido el límite de requests de tu plan

**Solución**:
1. Espera unos minutos antes de intentar de nuevo
2. Considera actualizar tu plan si usas la app frecuentemente
3. Para OpenAI: https://platform.openai.com/account/billing
4. Para Twelve Data: https://twelvedata.com/pricing
5. Para News API: https://newsapi.org/pricing

### Error: "Timeout" o "No se pudo conectar"

**Causa**: Problemas de conexión o imagen muy grande

**Solución**:
1. Verifica tu conexión a internet
2. Intenta con una imagen más pequeña (máx 5MB)
3. Comprime la imagen antes de subirla
4. Verifica que no hay firewall bloqueando las APIs

### Error: "Imagen inválida o muy grande"

**Causa**: La imagen excede el límite de tamaño de OpenAI (20MB)

**Solución**:
1. Comprime la imagen antes de subirla
2. Usa formato JPG en lugar de PNG (más ligero)
3. Reduce la resolución de la imagen
4. Recorta la imagen para mostrar solo el gráfico

## 📊 Límites de las APIs

### OpenAI (GPT-4o)
- **Límite de imagen**: 20MB por imagen
- **Límite de tokens**: 128,000 tokens de entrada
- **Rate limit**: Depende de tu tier (https://platform.openai.com/docs/guides/rate-limits)
- **Costo aproximado**: $0.01-0.05 por análisis de imagen

### Twelve Data
- **Plan gratuito**: 800 requests/día, 8 requests/minuto
- **Plan básico**: $7.99/mes, 3,000 requests/día
- **Delay**: 15 minutos en plan gratuito

### News API
- **Plan gratuito**: 100 requests/día
- **Plan developer**: $449/mes, 250,000 requests/mes
- **Límite de artículos**: 100 por request

## 🔐 Seguridad

### Buenas Prácticas

1. **Nunca compartas tus API keys**
   - No las subas a GitHub
   - No las compartas en Discord/Slack
   - No las incluyas en screenshots

2. **Usa variables de entorno**
   - Siempre usa `.env` para keys sensibles
   - Verifica que `.env` está en `.gitignore`

3. **Rota tus keys regularmente**
   - Cambia tus API keys cada 3-6 meses
   - Si sospechas que una key fue comprometida, revócala inmediatamente

4. **Monitorea el uso**
   - Revisa regularmente el uso de tus APIs
   - Configura alertas de billing
   - OpenAI: https://platform.openai.com/usage
   - Twelve Data: https://twelvedata.com/account/usage

5. **Usa restricciones de API**
   - Configura límites de gasto en OpenAI
   - Restringe las IPs permitidas si es posible
   - Usa API keys diferentes para desarrollo y producción

## 🌐 Deployment (Producción)

Si vas a deployar la app en producción (Vercel, Netlify, etc.), necesitas configurar las variables de entorno en la plataforma:

### Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable:
   - `VITE_OPENAI_API_KEY`
   - `VITE_TWELVE_DATA_API_KEY`
   - `VITE_NEWS_API_KEY`
4. Redeploy el proyecto

### Netlify
1. Ve a tu sitio en Netlify
2. Site settings → Environment variables
3. Agrega cada variable
4. Redeploy el sitio

### Render
1. Ve a tu servicio en Render
2. Environment → Environment Variables
3. Agrega cada variable
4. El servicio se redeployará automáticamente

## 📞 Soporte

Si sigues teniendo problemas después de seguir esta guía:

1. **Revisa los logs de la consola** del navegador (F12)
2. **Verifica el archivo `.env`** está en la raíz del proyecto
3. **Reinicia el servidor** después de cambiar las variables
4. **Verifica que las keys son válidas** en las respectivas plataformas

## 🎓 Recursos Adicionales

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Twelve Data API Documentation](https://twelvedata.com/docs)
- [News API Documentation](https://newsapi.org/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Desarrollado con ❤️ por PROFIT AI**
