# 🚀 INSTRUCCIONES RÁPIDAS DE DEPLOYMENT

## ⚡ Opción 1: Script Automático (Recomendado)

```bash
./deploy.sh "Añadir señales de noticias y mejorar analizador"
```

Esto hará automáticamente:
1. ✅ Build local para verificar
2. ✅ Git add + commit
3. ✅ Git push
4. ✅ Trigger deployment en Render

---

## 📝 Opción 2: Manual

### Paso 1: Commit y Push

```bash
git add .
git commit -m "feat: Añadir señales de noticias y mejorar analizador de imágenes"
git push origin main
```

### Paso 2: Configurar Variables en Render

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio `trading-ai-app`
3. Ve a **Environment**
4. Agrega estas variables (si no están):

```
VITE_OPENAI_API_KEY=tu-api-key-aqui

VITE_TWELVE_DATA_API_KEY=tu-api-key-aqui

VITE_NEWS_API_KEY=tu-api-key-aqui
```

5. Click **Save Changes**

### Paso 3: Esperar el Deploy

Render detectará el push automáticamente y hará el deploy (5-10 minutos)

---

## 🔍 Verificar el Deployment

Una vez completado:

1. Abre: https://trading-ai-app.onrender.com
2. Presiona F12 (abrir consola)
3. Ve a "Analyze"
4. Sube una imagen
5. Verifica que funcione

---

## 🆘 Si Algo Falla

### Ver Logs

1. Ve a Render Dashboard
2. Click en tu servicio
3. Click en **Logs**
4. Busca errores

### Errores Comunes

**"API key no configurada"**
→ Agrega las variables de entorno en Render

**"502 Bad Gateway"**
→ Revisa los logs del servidor en Render

**"Build failed"**
→ Verifica que `npm run build` funcione localmente

---

## ✅ Checklist

Antes de deployar:

- [ ] `npm run build` funciona localmente
- [ ] Hiciste commit de todos los cambios
- [ ] Las API keys están configuradas en Render
- [ ] `.env` NO está en el repositorio (está en .gitignore)

---

## 🎯 Nuevas Funcionalidades

### 1. Señales de Noticias
- 📰 Análisis de noticias con GPT-4o
- ⏰ Hora exacta de cada noticia
- 📊 Tendencia posible (alcista/bajista)
- 🎯 Timing de entrada preciso
- 💰 Objetivos de precio

### 2. Analizador Mejorado
- ✅ Mejor manejo de errores
- ✅ Mensajes específicos
- ✅ Logging detallado
- ✅ Timeout aumentado

---

## 📞 Soporte

Si tienes problemas:

1. Revisa `DEPLOY_RENDER.md` para más detalles
2. Verifica los logs en Render
3. Prueba localmente primero

---

**¡Listo para deployar!** 🚀
