@echo off
echo Checking dependencies...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found! Please install Node.js first.
    pause
    exit
)

:: Check Node.js version
for /f "tokens=1,2,3 delims=." %%a in ('node --version') do (
    set NODE_MAJOR=%%a
    set NODE_MINOR=%%b
    set NODE_PATCH=%%c
)

:: Remove 'v' from major version
set NODE_MAJOR=%NODE_MAJOR:~1%

if %NODE_MAJOR% NEQ 18 (
    echo WARNING: Recommended Node.js version is 18.x.x ^(LTS^)
    echo Current version: %NODE_MAJOR%.%NODE_MINOR%.%NODE_PATCH%
    echo To avoid compatibility issues, consider installing version 18.19.1
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit
)

:: Kill any process using ports 3001 and 5173
echo Freeing ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do taskkill /F /PID %%a 2>nul

:: Clean npm cache and node_modules
echo Cleaning cache and node_modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
npm cache clean --force

:: Force update dependencies
echo Installing dependencies...
call npm install --force

:: Create required directories if they don't exist
if not exist "checkpoints" mkdir checkpoints
if not exist "logs" mkdir logs
if not exist "saved-models" mkdir saved-models
if not exist "cache" mkdir cache
if not exist "cache\predictions" mkdir cache\predictions
if not exist "cache\models" mkdir cache\models
if not exist "cache\static" mkdir cache\static

:: Clear existing cache files
echo Clearing cache files...
del /q "cache\predictions\*.*" 2>nul
del /q "cache\models\*.*" 2>nul
del /q "cache\static\*.*" 2>nul

:: Start server with explicit file path and no watch mode initially
echo Starting Node.js server...
start cmd /k "node server.js"

:: Wait for server to start
timeout /t 5 /nobreak

:: Start React application with clean cache
echo Starting React application...
start cmd /k "npm run dev -- --force --clean-cache"

echo Development environment started successfully!