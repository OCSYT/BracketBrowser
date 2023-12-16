const { app, BrowserWindow, ipcMain, screen, protocol, session, Menu, MenuItem } = require('electron');
const path = require('path');
const fs = require("fs");
const process = require("process");
const contextMenu = require('electron-context-menu');





function createWindow() {

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: false,
    backgroundColor: "black",
    title: "BracketBrowser",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
  });



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

  var urls = null;
  fs.readFile(path.join(__dirname, '/blocklist.json'), 'utf8', (err, data) => {
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




  mainWindow.loadFile('browser.html');
  mainWindow.removeMenu();

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  var adblock = true;

  var isMaximized = false;
  ipcMain.on('maximize-window', () => {
    if (isMaximized) {
      mainWindow.unmaximize();
      isMaximized = false;
    } else {
      mainWindow.maximize();
      isMaximized = true;
    }
  });

  ipcMain.on('close-window', () => {
    mainWindow.destroy();
  });

  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  var prevbounds = null;
  ipcMain.on('drag:start', () => {
    isDragging = true;
    const cursorPosition = screen.getCursorScreenPoint();
    const windowPosition = mainWindow.getPosition();
    dragOffsetX = cursorPosition.x - windowPosition[0];
    dragOffsetY = cursorPosition.y - windowPosition[1];
    prevbounds = mainWindow.getBounds();
  });

  ipcMain.on('drag:move', () => {
    if (isDragging) {
      const cursorPosition = screen.getCursorScreenPoint();
      const newX = cursorPosition.x - dragOffsetX;
      const newY = cursorPosition.y - dragOffsetY;
      mainWindow.setBounds({ x: newX, y: newY, width: prevbounds.width, height: prevbounds.height });
    }
  });

  ipcMain.on('drag:end', () => {
    isDragging = false;
  });

  ipcMain.handle('newpage', async (event, url) => {

  });
  ipcMain.handle('adblock', async (event, value) => {
    adblock = value;
  });
  ipcMain.handle('inspector', async (event, value) => {
    if(value){
      mainWindow.webContents.openDevTools()
    }
    else{
      mainWindow.webContents.closeDevTools()
    }
  });
  return mainWindow;
}

function loadnewpage(mainWindow, url) {
  mainWindow.webContents.executeJavaScript(`LoadNewLink(${url})`)
}

function loadPlugins(mainWindow) {
  var env = process.env.NODE_ENV || 'development';
  var pluginsFolderPath = null;
  if (env != "development") {
    pluginsFolderPath = path.join(path.dirname(process.resourcesPath), '/plugins/').replaceAll("\\", "/");
  }
  else {
    pluginsFolderPath = path.join(__dirname, '/plugins/').replaceAll("\\", "/");
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


protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.whenReady().then(() => {

  // Create the Electron window
  const mainWindow = createWindow();
  app.on("web-contents-created", (e, contents) => {
    if (contents.getType() == "webview") {
      contextMenu({ window: contents, }); 
    }
  });

  loadPlugins(mainWindow, path.join(__dirname, '/plugins/'))


  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
      loadNewPage(mainWindow, url);
    }
  });
});

// Function to load a new page in the mainWindow
function loadNewPage(mainWindow, url) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`LoadNewLink("${url}")`)
      .catch(error => {
        console.error('Error loading new page:', error);
      });
  }
}