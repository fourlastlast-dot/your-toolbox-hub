// Wrapper service worker to disable install/uninstall redirects without touching the bundled file.
// This keeps the rest of the extension behavior intact.

(() => {
  try {
    // Guard against welcome/install tab opening
    const originalTabsCreate = chrome?.tabs?.create?.bind(chrome.tabs);
    if (originalTabsCreate) {
      chrome.tabs.create = (createProperties, callback) => {
        try {
          const url = createProperties?.url || "";
          if (typeof url === "string" && url.includes("ai-toolbox.co/install-success")) {
            // Swallow this specific tab open.
            if (typeof callback === "function") callback(undefined);
            return;
          }
        } catch (_) {
          // fall through
        }

        return originalTabsCreate(createProperties, callback);
      };
    }

    // Guard against uninstall redirect registration
    const originalSetUninstallURL = chrome?.runtime?.setUninstallURL?.bind(chrome.runtime);
    if (originalSetUninstallURL) {
      chrome.runtime.setUninstallURL = (url, callback) => {
        try {
          if (typeof url === "string" && url.includes("ai-toolbox.co/uninstall-extension")) {
            // Clear instead of setting.
            return originalSetUninstallURL("", callback);
          }
        } catch (_) {
          // fall through
        }

        return originalSetUninstallURL(url, callback);
      };

      // Best effort: clear any previously set uninstall URL on startup.
      try {
        originalSetUninstallURL("");
      } catch (_) {
        // ignore
      }
    }
  } catch (_) {
    // ignore
  }

  // Load the original bundled service worker.
  // MV3 service workers (non-module) support importScripts.
  importScripts("background.original.js");
})();
