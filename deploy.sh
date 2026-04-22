#!/bin/bash

# Script de deployment para Render.com
# Uso: ./deploy.sh "mensaje del commit"

set -e

echo "🚀 Iniciando proceso de deployment..."

# Verificar que se proporcionó un mensaje de commit
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar un mensaje de commit"
    echo "Uso: ./deploy.sh \"tu mensaje aquí\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo ""
echo "📦 Verificando build local..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: El build falló. Corrige los errores antes de deployar."
    exit 1
fi

echo "✅ Build local exitoso"
echo ""

echo "📝 Haciendo commit de cambios..."
git add .
git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo "⚠️  No hay cambios para commitear o el commit falló"
fi

echo ""
echo "🔄 Pushing a GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Error: Push falló"
    exit 1
fi

echo ""
echo "✅ Push exitoso!"
echo ""
echo "🎉 Deployment iniciado en Render.com"
echo ""
echo "📊 Monitorea el progreso en:"
echo "   https://dashboard.render.com"
echo ""
echo "🌐 Tu app estará disponible en:"
echo "   https://trading-ai-app.onrender.com"
echo ""
echo "⏱️  El deployment tomará aproximadamente 5-10 minutos"
echo ""
echo "💡 Tip: Puedes ver los logs en tiempo real en el dashboard de Render"
echo ""
