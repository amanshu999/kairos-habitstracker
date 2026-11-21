const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 840,
    minHeight: 560,
    title: 'Kairos - Terminal Consistency Engine',
    backgroundColor: '#090a0f',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const distHtmlPath = path.join(__dirname, '../dist/index.html');
  const hasDist = fs.existsSync(distHtmlPath);
  const isDevServer = process.env.VITE_DEV_SERVER_URL || (process.env.NODE_ENV === 'development' && !hasDist);

  if (isDevServer) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(distHtmlPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Enable F12 and Ctrl+Shift+I to toggle DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && (input.key === 'I' || input.key === 'i'))) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  // Open all target="_blank" links in default external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
