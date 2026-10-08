// ============================================================
// SchedSync — Preload Script
// ============================================================
// This script runs in a sandboxed context before the renderer
// loads. It uses contextBridge to safely expose any needed
// APIs to the renderer process.
// ============================================================

const { contextBridge } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('schedSync', {
  // Platform info (useful for platform-specific UI tweaks)
  platform: process.platform,

  // App version from package.json
  getVersion: () => {
    try {
      const pkg = require('./package.json');
      return pkg.version;
    } catch {
      return '1.0.0';
    }
  }
});
