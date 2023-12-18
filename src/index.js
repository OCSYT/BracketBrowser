/* Node Modules */
const { app, BrowserWindow, ipcMain, screen, protocol, session, Menu, MenuItem } = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');
const fs = require("fs");

/* Set app paths */
const paths = {
  root: app.getAppPath(),
  src: path.join(app.getAppPath(), 'src')
};

/* Disable gpu and transparent visuals if not win32 or darwin */
if (process.platform !== "win32" && process.platform !== "darwin") { // TODO: Add option to enable or disable via user prefrences
  app.commandLine.appendSwitch("enable-transparent-visuals");
  app.commandLine.appendSwitch("disable-gpu");
  app.disableHardwareAcceleration();
};

/* Window functions */
const { createMainWindow } = require("./scripts/window");

function checkInternet(cb) {
  require('dns').lookup('google.com', function (err) {
    if (err && err.code == "ENOTFOUND") {
      cb(false);
    } else {
      cb(true);
    }
  })
};

// Function to load a new page in the mainWindow
function loadNewPage(mainWindow, url) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`LoadNewLink("${url}")`)
      .catch(error => {
        console.error('Error loading new page:', error);
      });
  }
}

/* By default enable adblocking */
var adblock = true;

/* Parse ads */
async function fetchAndParseBlocklists(urls) {
  try {
    const allDomains = new Set();
    // Fetch content from each unique URL
    const uniqueUrls = [...new Set(urls)]; // Remove duplicate URLs
    for (const url of uniqueUrls) {
      const response = await fetch(url);
      if (response.ok) {
        const blocklist = await response.text();
        // Extract domains from each blocklist
        const adDomains = blocklist.split("\n");
        adDomains.forEach((domain) => {
          if (!domain.startsWith("#")) {
            const trimmedDomain = domain.replace("127.0.0.1 ", "").replace("0.0.0.0 ", "").trim();
            if (trimmedDomain !== '') {
              allDomains.add(trimmedDomain);
            }
          } else {
            // Handle other lines if needed
          }
        });
      } else {
        throw new Error(`Failed to fetch ${url}`);
      }
    }
    const uniqueDomainArray = [...allDomains]; // Convert Set to an array
    console.log(uniqueDomainArray);
    return uniqueDomainArray;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/* Read blocked hosts */
var urls = null;
fs.readFile(path.join(paths.src, 'data', '/blocklist.json'), 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }
  try {
    urls = JSON.parse(data).urls;
    fetchAndParseBlocklists(urls).then(adDomains => {
      const filter = {
        urls: ['<all_urls>'],
      };
      session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        const url = details.url;
        var isAd = false;
        // Check if the URL matches any in the fetched adDomains
        if (adblock) {
          isAd = adDomains.some(domain => {
            const included = url.includes(domain) && calculateJaccardSimilarity(url, domain) > 25;
            if (included) {
              console.log(`Domain compared: ${domain}, Similarity: ${calculateJaccardSimilarity(url, domain)}`);
            }
            return included;
          });
        }
        if (!isAd) {
          // Allow the request to continue
          callback({});
        } else {
          mainWindow.webContents.executeJavaScript(`console.log("Blocked ad: " + "${url}");`)
          callback({ cancel: true });
        }
      });
    });
  } catch {

  }
});

/* gets similarity between url and domain as a percentage */
function calculateJaccardSimilarity(url, domain) {
  const urlSet = new Set();
  const domainSet = new Set();
  // Generate sets of character pairs (bigrams) for URL and domain
  for (let i = 0; i < url.length - 1; i++) {
    urlSet.add(url.substr(i, 2)); // Change 2 to the desired n-gram size (e.g., 3 for trigrams)
  }
  for (let i = 0; i < domain.length - 1; i++) {
    domainSet.add(domain.substr(i, 2)); // Change 2 to the desired n-gram size (e.g., 3 for trigrams)
  }
  // Calculate Jaccard similarity coefficient
  const intersection = new Set([...urlSet].filter(x => domainSet.has(x)));
  const union = new Set([...urlSet, ...domainSet]);
  const similarity = intersection.size / union.size;
  const similarityPercentage = similarity * 100;
  return similarityPercentage;
}

/* Load plugins based on development or production paths */
function loadPlugins(mainWindow) {
  var env = process.env.NODE_ENV || 'development';
  var pluginsFolderPath = null;
  if (env != "development") {
    pluginsFolderPath = path.join(path.dirname(process.resourcesPath), '/plugins/').replaceAll("\\", "/");
  } else {
    pluginsFolderPath = path.join(paths.src, '/plugins/').replaceAll("\\", "/");
  }
  fs.readdir(pluginsFolderPath, (err, files) => {
    if (err) {
      console.log('Error reading plugins folder:', err);
      return;
    }
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(pluginsFolderPath, file);
        fs.readFile(filePath, 'utf8', (error, data) => {
          if (error) {
            console.log(`Error reading file ${filePath}:`, error);
            return;
          }
          // Execute the JavaScript code from the file in the mainWindow
          mainWindow.webContents.executeJavaScript(data)
            .catch(execError => {
              console.log(`Error executing ${filePath}:`, execError);
            });
        });
      }
    });
  });
}

/* Register protocol schemes */
protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/* Handles ipc calls from the renderer procress */
ipcMain.handle('adblock', async (event, value) => {
  adblock = value;
});
ipcMain.handle('inspector', async (event, value) => {
  if (value) {
    PageView.webContents.openDevTools()
  } else {
    PageView.webContents.closeDevTools()
  }
});

/* When app ready prepare and then show main window */
app.whenReady().then(() => {
  // Create mainWindow, load the rest of the app, etc...
  console.log("Checking for internet and getting updates");
  app.whenReady().then(async () => {
    /* Create windows */
    createMainWindow();
    /* Context menu */
    app.on("web-contents-created", (e, contents) => {
      if (contents.getType() == "webview") {
        contextMenu({ window: contents, });
      }
    });
    /* Load plugins */
    loadPlugins(mainWindow, path.join(__dirname, '/plugins/'))
    /* Handle opening urls (MacOS) */
    app.on('open-url', (event, url) => {
      event.preventDefault();
      if (mainWindow) {
        loadNewPage(mainWindow, url);
      }
    });
    /* Check for internet */
    checkInternet(function (isConnected) {
      if (isConnected) {
        mainWindow.show();
        mainWindow.center();
        ipcMain.handle('newpage', async (event, url) => {

        });
      } else {
        // TODO: Handle this
      };
    });
  });
});

/* If all windows are closed, quit app, exept if on darwin */
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

/* Before app closes */
app.on("before-quit", function () {

});

/* When app ready */
app.on("ready", () => {

})