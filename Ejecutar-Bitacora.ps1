# Bitácora de Cisco LC - Ejecutor
# Este script inicia automáticamente la aplicación

param(
    [switch]$Build,
    [switch]$Electron
)

# Configuración
$AppName = "Bitácora de Cisco LC"
$Port = 5173
$Url = "http://localhost:$Port"

# Función para mostrar mensajes con colores
function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

# Función para verificar si un puerto está en uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Banner
Clear-Host
Write-ColorText "========================================" "Cyan"
Write-ColorText "    $AppName" "Yellow"
Write-ColorText "========================================" "Cyan"
Write-Host ""

# Verificar Node.js
Write-ColorText "Verificando requisitos..." "Gray"
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-ColorText "✓ Node.js: $nodeVersion" "Green"
    } else {
        throw "Node.js no encontrado"
    }
} catch {
    Write-ColorText "✗ Error: Node.js no está instalado" "Red"
    Write-ColorText "Descarga e instala Node.js desde: https://nodejs.org/" "Yellow"
    Write-Host ""
    Write-ColorText "Presiona cualquier tecla para salir..." "Gray"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-ColorText "✓ npm: v$npmVersion" "Green"
    }
} catch {
    Write-ColorText "✗ Error: npm no está disponible" "Red"
    exit 1
}

Write-Host ""

# Instalar dependencias si es necesario
if (!(Test-Path "node_modules")) {
    Write-ColorText "Instalando dependencias por primera vez..." "Yellow"
    Write-ColorText "Esto puede tardar unos minutos..." "Gray"
    Write-Host ""
    
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorText "✗ Error al instalar dependencias" "Red"
        Write-Host ""
        Write-ColorText "Presiona cualquier tecla para salir..." "Gray"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Write-ColorText "✓ Dependencias instaladas correctamente" "Green"
    Write-Host ""
}

# Opción: Crear build para producción
if ($Build) {
    Write-ColorText "Creando build de producción..." "Yellow"
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "✓ Build creado en ./dist/" "Green"
    }
    exit 0
}

# Opción: Ejecutar con Electron
if ($Electron) {
    Write-ColorText "Iniciando aplicación con Electron..." "Yellow"
    
    # Verificar si Electron está instalado
    if (!(Test-Path "node_modules/electron")) {
        Write-ColorText "Instalando Electron..." "Yellow"
        npm install --save-dev electron concurrently wait-on electron-builder
    }
    
    Write-ColorText "Abriendo aplicación de escritorio..." "Green"
    npm run electron-dev
    exit 0
}

# Verificar si el servidor ya está corriendo
if (Test-Port $Port) {
    Write-ColorText "⚠ El servidor ya está corriendo en el puerto $Port" "Yellow"
    Write-ColorText "Abriendo en el navegador..." "Green"
    Start-Process $Url
    Write-Host ""
    Write-ColorText "¡Aplicación lista!" "Green"
    Write-ColorText "Si no se abrió automáticamente, ve a: $Url" "Gray"
} else {
    # Iniciar servidor de desarrollo
    Write-ColorText "Iniciando servidor de desarrollo..." "Yellow"
    Write-Host ""
    Write-ColorText "La aplicación se abrirá automáticamente en tu navegador." "Green"
    Write-ColorText "Si no se abre, ve a: $Url" "Gray"
    Write-Host ""
    Write-ColorText "Para cerrar la aplicación, presiona Ctrl+C en esta ventana." "Gray"
    Write-Host ""
    
    # Abrir navegador después de unos segundos (en background)
    Start-Job -ScriptBlock {
        Start-Sleep 5
        Start-Process "http://localhost:5173"
    } | Out-Null
    
    # Iniciar Vite
    npm run dev
}

Write-Host ""
Write-ColorText "Presiona cualquier tecla para salir..." "Gray"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")