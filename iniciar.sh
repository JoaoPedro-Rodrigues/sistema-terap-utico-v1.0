#!/bin/bash
# ─── Iniciar o Sistema Terapêutico Online ────────────────────────────────────
# Execute: bash iniciar.sh

echo ""
echo "🌿 Sistema de Atendimento Terapêutico Online"
echo "============================================"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale em: https://python.org"
    exit 1
fi

# Verificar e instalar dependências
echo "📦 Verificando dependências..."
pip install flask werkzeug --quiet --break-system-packages 2>/dev/null || pip install flask werkzeug --quiet

echo "🗄️  Iniciando banco de dados SQLite3..."
echo "🚀 Servidor rodando em: http://localhost:5000"
echo ""
echo "  Login de demo:"
echo "  E-mail: ana@terapia.com"
echo "  Senha:  senha123"
echo ""
echo "  Pressione CTRL+C para parar."
echo "============================================"
echo ""

cd "$(dirname "$0")"
python3 backend/server.py
