@echo off
echo Iniciando ambiente de desenvolvimento...

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js primeiro.
    echo Visite https://nodejs.org e instale a versao LTS (18.19.1)
    pause
    exit
)

:: Verifica a versão do Node.js
for /f "tokens=1,2,3 delims=." %%a in ('node --version') do (
    set NODE_MAJOR=%%a
    set NODE_MINOR=%%b
    set NODE_PATCH=%%c
)

:: Remove 'v' da versão major
set NODE_MAJOR=%NODE_MAJOR:~1%

if %NODE_MAJOR% NEQ 18 (
    echo AVISO: A versao recomendada do Node.js eh 18.x.x ^(LTS^)
    echo Versao atual: %NODE_MAJOR%.%NODE_MINOR%.%NODE_PATCH%
    echo Para evitar problemas de compatibilidade, considere instalar a versao 18.19.1
    choice /C YN /M "Continuar mesmo assim"
    if errorlevel 2 exit
)

:: Mata processos usando as portas 3001 e 5173
echo Liberando portas 3001 e 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do taskkill /F /PID %%a 2>nul

:: Limpa cache e node_modules
echo Limpando cache e node_modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
npm cache clean --force

:: Força atualização das dependências
echo Instalando dependencias...
call npm install --force

:: Cria diretórios necessários se não existirem
if not exist "checkpoints" mkdir checkpoints
if not exist "logs" mkdir logs
if not exist "saved-models" mkdir saved-models
if not exist "cache" mkdir cache
if not exist "cache\predictions" mkdir cache\predictions
if not exist "cache\models" mkdir cache\models
if not exist "cache\static" mkdir cache\static

:: Limpa arquivos de cache existentes
echo Limpando arquivos de cache...
del /q "cache\predictions\*.*" 2>nul
del /q "cache\models\*.*" 2>nul
del /q "cache\static\*.*" 2>nul

:: Inicia o servidor com caminho explícito e sem modo watch inicialmente
echo Iniciando servidor Node.js...
start cmd /k "node server.js"

:: Aguarda o servidor iniciar
timeout /t 5 /nobreak

:: Inicia aplicação React com cache limpo
echo Iniciando aplicacao React...
start cmd /k "npm run dev -- --force --clean-cache"

echo Ambiente de desenvolvimento iniciado com sucesso!