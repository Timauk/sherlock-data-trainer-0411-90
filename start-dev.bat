@echo off
echo Verificando dependencias...

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js primeiro.
    pause
    exit
)

:: Mata qualquer processo que esteja usando a porta 3001
echo Liberando porta 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do taskkill /F /PID %%a 2>nul

:: Força a atualização das dependências
echo Atualizando dependencias...
call npm install --force

:: Verifica se a pasta checkpoints existe, se não, cria
if not exist "checkpoints" (
    echo Criando pasta checkpoints...
    mkdir checkpoints
    echo Pasta checkpoints criada com sucesso!
) else (
    echo Pasta checkpoints ja existe.
)

:: Verifica se a pasta logs existe, se não, cria
if not exist "logs" (
    echo Criando pasta logs...
    mkdir logs
    echo Pasta logs criada com sucesso!
) else (
    echo Pasta logs ja existe.
)

:: Verifica se a pasta saved-models existe, se não, cria
if not exist "saved-models" (
    echo Criando pasta saved-models...
    mkdir saved-models
    echo Pasta saved-models criada com sucesso!
) else (
    echo Pasta saved-models ja existe.
)

:: Inicia o servidor em uma nova janela
echo Iniciando servidor Node.js...
start cmd /k "node --watch server.js"

:: Aguarda 5 segundos para garantir que o servidor iniciou
timeout /t 5 /nobreak

:: Inicia a aplicação React e abre o navegador
echo Iniciando aplicacao React...
start cmd /k "npm run dev -- --open"

echo Ambiente de desenvolvimento iniciado com sucesso!