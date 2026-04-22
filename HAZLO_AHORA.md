# 🚀 HAZ ESTO AHORA PARA DEPLOYAR

## Opción 1: Automático (MÁS FÁCIL) ⚡

```bash
./deploy.sh "Añadir señales de noticias y mejorar analizador"
```

**¡ESO ES TODO!** El script hará todo automáticamente.

---

## Opción 2: Manual (3 comandos) 📝

```bash
git add .
```

```bash
git commit -m "feat: Añadir señales de noticias y mejorar analizador de imágenes"
```

```bash
git push origin main
```

**¡LISTO!** Render detectará el push y hará el deploy automáticamente.

---

## ⏱️ Tiempo de Espera

El deployment tomará **5-10 minutos**.

Puedes monitorear el progreso en:
👉 https://dashboard.render.com

---

## 🌐 Tu App Estará en:

👉 https://trading-ai-app.onrender.com

---

## ⚠️ IMPORTANTE: Configurar Variables en Render

**SOLO LA PRIMERA VEZ** (si no lo has hecho):

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio
3. Ve a **Environment**
4. Agrega estas 3 variables:

```
VITE_OPENAI_API_KEY=tu-api-key-aqui

VITE_TWELVE_DATA_API_KEY=tu-api-key-aqui

VITE_NEWS_API_KEY=tu-api-key-aqui
```

5. Click **Save Changes**

---

## ✅ Verificar que Funcionó

1. Abre tu app: https://trading-ai-app.onrender.com
2. Ve a "Markets"
3. Click en "Señales de Noticias" (botón azul arriba)
4. Selecciona un activo (ej: XAU/USD)
5. ¡Deberías ver las señales de noticias! 🎉

---

## 🆘 Si Algo Falla

1. Ve a Render Dashboard → Logs
2. Busca errores en rojo
3. Verifica que las 3 variables de entorno estén configuradas
4. Si es necesario, haz un "Manual Deploy"

---

## 🎯 Nuevas Funcionalidades

Después del deploy tendrás:

✅ **Señales de Noticias** - Análisis de noticias con hora exacta y tendencia
✅ **Analizador Mejorado** - Mejor manejo de errores y mensajes claros
✅ **14 Activos** - Oro, Bitcoin, Forex, Acciones, Índices, Commodities

---

**¡HAZLO AHORA!** 🚀

```bash
./deploy.sh "Añadir señales de noticias y mejorar analizador"
```
