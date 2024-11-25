@echo off
echo Verificando dependencias...

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js primeiro.
    pause
    exit
)

:: Verifica a versão do Node.js
for /f "tokens=1,2,3 delims=." %%a in ('node --version') do (
    set NODE_MAJOR=%%a
    set NODE_MINOR=%%b
    set NODE_PATCH=%%c
)

:: Remove o 'v' do início da versão major
set NODE_MAJOR=%NODE_MAJOR:~1%

if %NODE_MAJOR% NEQ 18 (
    echo AVISO: Versao do Node.js recomendada eh 18.x.x ^(LTS^)
    echo Versao atual: %NODE_MAJOR%.%NODE_MINOR%.%NODE_PATCH%
    echo Para evitar problemas de compatibilidade, considere instalar a versao 18.19.1
    choice /C YN /M "Deseja continuar mesmo assim"
    if errorlevel 2 exit
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