@echo off
echo Verificando dependencias...

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js primeiro.
    pause
    exit
)

:: Verifica se as dependências estão instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
) else (
    echo Dependencias ja instaladas.
)

:: Verifica se a pasta checkpoints existe, se não, cria
if not exist "checkpoints" (
    echo Criando pasta checkpoints...
    mkdir checkpoints
    echo Pasta checkpoints criada com sucesso!
) else (
    echo Pasta checkpoints ja existe.
)

:: Inicia o servidor em uma nova janela
echo Iniciando servidor Node.js...
start cmd /k "node --watch server.js"

:: Aguarda 2 segundos
timeout /t 2 /nobreak

:: Inicia a aplicação React
echo Iniciando aplicacao React...
start cmd /k "npm run dev"

echo Ambiente de desenvolvimento iniciado com sucesso!