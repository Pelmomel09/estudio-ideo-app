const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuración de actualización silenciosa
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280, 
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icono.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    
    // Busca actualizaciones 3 segundos después de abrir, sin avisar al usuario
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  } else {
    win.loadURL('http://localhost:5173');
  }
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});