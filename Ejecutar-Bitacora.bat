@echo off
title Bitacora de Cisco LC - Laboratorio
echo.
echo ================================================
echo    BITACORA DE CISCO LC - LABORATORIO
echo ================================================
echo.
echo Iniciando aplicacion...
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Verificar si npm esta instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm no esta disponible.
    echo.
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias por primera vez...
    echo Esto puede tardar unos minutos...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: No se pudieron instalar las dependencias.
        echo.
        pause
        exit /b 1
    )
)

REM Iniciar el servidor de desarrollo
echo Iniciando servidor de desarrollo...
echo.
echo La aplicacion se abrira automaticamente en tu navegador.
echo Si no se abre, ve a: http://localhost:5173
echo.
echo Para cerrar la aplicacion, presiona Ctrl+C en esta ventana.
echo.

REM Abrir el navegador despues de unos segundos
timeout /t 3 /nobreak >nul
start http://localhost:5173

REM Iniciar Vite
npm run dev