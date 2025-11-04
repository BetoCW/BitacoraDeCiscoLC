# 📋 Bitácora de Cisco LC - Sistema de Laboratorio

## 🚀 Inicio Rápido

### Opción 1: Doble Click (Recomendado)
1. **Haz doble click en:** `Ejecutar-Bitacora.bat`
2. **¡Listo!** Se abrirá automáticamente en tu navegador

### Opción 2: PowerShell (Más opciones)
1. **Click derecho** en `Ejecutar-Bitacora.ps1`
2. **Selecciona:** "Ejecutar con PowerShell"

## 💻 Requisitos del Sistema

- **Windows:** 10/11 (recomendado)
- **Node.js:** v16 o superior
- **Navegador:** Chrome, Firefox, Edge (moderno)
- **RAM:** 4GB mínimo
- **Espacio:** 500MB libres

## 📦 Instalación de Node.js

Si no tienes Node.js instalado:

1. **Descarga desde:** https://nodejs.org/
2. **Instala** la versión LTS (recomendada)
3. **Reinicia** tu PC
4. **Ejecuta** el archivo `.bat` nuevamente

## 🎮 Uso de la Aplicación

### Crear Reservas
1. Click en **"Reservar"** o en cualquier día del calendario
2. Completa los datos del estudiante
3. Selecciona profesor, materia y horarios
4. Click **"Confirmar Reserva"**

### Gestionar Materiales
1. Click en cualquier **reserva existente**
2. Se abre el modal de materiales
3. Agrega los materiales necesarios
4. Click **"Guardar Materiales"**

### Exportar/Importar Datos
1. Usa los botones **"Exportar Datos"** / **"Importar Datos"**
2. Para transferir a otra PC: Exporta → Copia archivo → Importa

## 📁 Estructura de Archivos

```
BitacoraDeCiscoLC/
├── 📄 Ejecutar-Bitacora.bat      ← ¡USAR ESTE!
├── 📄 Ejecutar-Bitacora.ps1      ← Alternativo
├── 📁 src/                       ← Código fuente
├── 📁 dist/                      ← Build de producción
└── 📄 README.md                  ← Este archivo
```

## 🔧 Opciones Avanzadas

### Crear Ejecutable (.exe)
```bash
# Instalar dependencias de Electron
npm install --save-dev electron electron-builder

# Crear ejecutable
npm run dist
```

### Modo Desarrollo
```bash
npm install    # Instalar dependencias
npm run dev    # Servidor de desarrollo
```

### Build para Producción
```bash
npm run build  # Crear versión optimizada
```

## 📊 Características

### ✅ Gestión de Reservas
- Calendario visual mensual
- Reservas por profesor (Olivares, Bernabé, Miguel)
- Validación de horarios y conflictos
- Materias: Redes, Conmutación, Administración

### ✅ Control de Materiales
- Categorías: Cables, Routers, Servidores, Firewall, Otros
- Materiales predefinidos y personalizados
- Control de cantidades
- Historial por reserva

### ✅ Persistencia Local
- Datos guardados en el navegador
- Exportación a archivo JSON
- Importación desde backup
- No requiere internet

## 🛠️ Solución de Problemas

### Error: "Node.js no encontrado"
- **Solución:** Instala Node.js desde https://nodejs.org/
- **Reinicia** tu PC después de instalar

### Error: "npm install falló"
- **Solución:** 
  1. Abre PowerShell como Administrador
  2. Ejecuta: `npm cache clean --force`
  3. Vuelve a ejecutar el `.bat`

### La aplicación no se abre
- **Verifica** que no hay antivirus bloqueando
- **Ejecuta** como Administrador
- **Abre manualmente:** http://localhost:5173

### Puerto 5173 ocupado
- **El script detecta** automáticamente si está en uso
- **Abrirá** directamente la aplicación existente

## 📞 Soporte

Si tienes problemas:
1. **Verifica** que Node.js esté instalado
2. **Ejecuta** como Administrador
3. **Revisa** que no hay antivirus bloqueando

## 🚀 Versiones

- **v1.0.0** - Sistema básico de reservas
- **v1.1.0** - Gestión de materiales
- **v1.2.0** - Exportar/Importar datos
- **v1.3.0** - Ejecutable portable

---

**¡Listo para usar!** 🎉 Solo haz doble click en `Ejecutar-Bitacora.bat`