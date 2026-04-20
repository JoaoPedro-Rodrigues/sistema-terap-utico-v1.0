@echo off
echo.
echo  Sistema de Atendimento Terapeutico Online
echo  ==========================================
echo.
echo  Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERRO: Python nao encontrado. Baixe em: https://python.org
    pause
    exit
)

echo  Instalando dependencias...
pip install flask werkzeug --quiet

echo  Iniciando servidor em http://localhost:5000
echo.
echo  Login de demonstracao:
echo    E-mail: ana@terapia.com
echo    Senha : senha123
echo.
echo  Pressione CTRL+C para parar.
echo  ==========================================
echo.

cd /d "%~dp0"
python backend\server.py
pause
