const { app, BrowserWindow, dialog } = require('electron'); // NUEVO: Añadimos 'dialog' para mostrar mensajes
const path = require('path');
const { autoUpdater } = require('electron-updater'); // NUEVO: Importamos el actualizador

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280, 
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    
    // NUEVO: Le decimos a la app que busque actualizaciones al abrirse
    autoUpdater.checkForUpdatesAndNotify();
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

// NUEVO: Programamos qué pasa cuando se descarga una actualización
autoUpdater.on('update-downloaded', () => {
  // Muestra un mensaje profesional al cliente
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización lista',
    message: 'Hay una nueva versión de Estudio Ideo. Se instalará automáticamente al cerrar la aplicación.',
    buttons: ['Entendido']
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});