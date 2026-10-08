// ============================================================
// SchedSync — Electron Main Process
// ============================================================
// This is the main process that creates the browser window
// and handles the application lifecycle.
// ============================================================

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference to prevent garbage collection
let mainWindow = null;

/**
 * Creates the main application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'SchedSync — CPU Scheduling & Memory Paging Simulator',
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false, // Don't show until ready-to-show for a smooth launch
    backgroundColor: '#0f172a' // Dark background to prevent flash
  });

  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Show window when content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Clean up on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// App Lifecycle Events
// ============================================================

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon clicked and no windows open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
