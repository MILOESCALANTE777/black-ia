# Deploy en Render

## Pasos para hacer la app online

### 1. Subir el código a GitHub

```bash
git init
git add .
git commit -m "feat: add Express proxy server for production deploy"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Crear el servicio en Render

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Click en **New > Web Service**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: trading-ai-app
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3. Configurar variables de entorno en Render

En **Settings > Environment**, agrega estas variables **ANTES** del primer deploy (son necesarias durante el build):

| Variable | Valor |
|----------|-------|
| `VITE_OPENAI_API_KEY` | tu key de OpenAI |
| `VITE_TWELVE_DATA_API_KEY` | tu key de Twelve Data |
| `VITE_NEWS_API_KEY` | tu key de NewsAPI |
| `NODE_ENV` | `production` |

> ⚠️ Las variables `VITE_*` se embeben en el bundle durante el build. Deben estar configuradas ANTES de hacer el deploy.

### 4. Deploy

Click en **Deploy** y espera ~3 minutos. Tu app estará disponible en `https://trading-ai-app.onrender.com`.

## Arquitectura en producción

```
Browser → Render (Express server)
              ├── /api/openai/* → proxy → api.openai.com
              ├── /api/twelve/* → proxy → api.twelvedata.com
              ├── /api/news/*   → proxy → newsapi.org
              └── /*            → sirve dist/ (React SPA)
```

El servidor Express actúa como proxy para las APIs externas (evita CORS) y sirve el frontend compilado.
