// Main entry point for QLCV application (Vite module entry)
// Provides bridge between old app.js (demo) and new modular architecture

import { APP_CONFIG } from "./utils/constants.js";
import { authService } from "./auth/authService.js";
import { getAdapter, resetAdapter } from "./api/dataAdapter.js";

console.log(`QLCV App initializing... (demo: ${APP_CONFIG.DEMO_MODE})`);

// Export services to window for app.js (demo) to use
window.__QLCV = {
  APP_CONFIG,
  authService,
  getAdapter,
  resetAdapter,
};

// Auto-initialize
async function init() {
  try {
    await authService.checkSession();
    console.log("Session checked");
  } catch (err) {
    console.warn("Session check failed:", err);
  }
}

init();
