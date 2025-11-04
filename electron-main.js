const { app, BrowserWindow, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let viteProcess;

const createWindow = () => {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.ico'), // Opcional: agregar icono
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default',
    title: 'Bitácora de Cisco LC - Laboratorio'
  });

  // Remover el menú por defecto (opcional)
  Menu.setApplicationMenu(null);

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Opcional: abrir DevTools en desarrollo
    // mainWindow.webContents.openDevTools();
  });

  // Manejar cierre de ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (viteProcess) {
      viteProcess.kill();
    }
  });

  return mainWindow;
};

const startViteServer = () => {
  return new Promise((resolve, reject) => {
    // Verificar si ya existe un servidor corriendo
    const checkServer = () => {
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 5173,
        path: '/',
        method: 'GET',
        timeout: 1000
      };

      const req = http.request(options, (res) => {
        resolve('http://localhost:5173');
      });

      req.on('error', () => {
        // Servidor no está corriendo, iniciarlo
        console.log('Iniciando servidor Vite...');
        
        viteProcess = spawn('npm', ['run', 'dev'], {
          cwd: __dirname,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        viteProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('Vite:', output);
          
          // Buscar cuando el servidor esté listo
          if (output.includes('Local:') && output.includes('5173')) {
            setTimeout(() => resolve('http://localhost:5173'), 1000);
          }
        });

        viteProcess.stderr.on('data', (data) => {
          console.error('Vite Error:', data.toString());
        });

        viteProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout de seguridad
        setTimeout(() => {
          resolve('http://localhost:5173');
        }, 10000);
      });

      req.setTimeout(1000);
      req.end();
    };

    checkServer();
  });
};

// Este método se llama cuando Electron ha terminado de inicializar
app.whenReady().then(async () => {
  try {
    // Crear ventana
    createWindow();
    
    // Mostrar splash o loading
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cargando...</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: white;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 4px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h1 { margin: 0 0 10px; font-size: 24px; }
            p { margin: 0; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h1>Bitácora de Cisco LC</h1>
            <p>Iniciando laboratorio...</p>
          </div>
        </body>
      </html>
    `));

    // Iniciar servidor Vite
    const serverUrl = await startViteServer();
    
    // Cargar la aplicación
    setTimeout(() => {
      mainWindow.loadURL(serverUrl);
    }, 2000);

  } catch (error) {
    console.error('Error al iniciar:', error);
    
    // Mostrar error en la ventana
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              background: #f5f5f5;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .error {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .instructions {
              background: #ecf0f1;
              padding: 20px;
              border-radius: 5px;
              margin-top: 20px;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Error al iniciar</h1>
            <p>No se pudo iniciar el servidor de desarrollo.</p>
            <div class="instructions">
              <strong>Para solucionar:</strong>
              <ol>
                <li>Asegúrate de que Node.js esté instalado</li>
                <li>Ejecuta <code>npm install</code> en la carpeta del proyecto</li>
                <li>Cierra esta ventana e intenta nuevamente</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `));
  }
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (viteProcess) {
    viteProcess.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Manejar certificados (para desarrollo local)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('http://localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});