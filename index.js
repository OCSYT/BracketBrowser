const { app, BrowserWindow, protocol, ipcMain, screen } = require('electron');
const contextMenu = require('electron-context-menu');

contextMenu({
  showSaveImageAs: true
});

const path = require('path');
const closest_match = require("closest-match");
const { url } = require('inspector');


function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Hide the default window frame
    transparent: false,
    backgroundColor: "black",
    title: "BracketBrowser",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
    },
  });


  titlebaroffset = 160;
  windowsize = -10;

  // Create a custom title bar
  const customTitleBar = new BrowserWindow({
    frame: false,
    width: mainWindow.getSize()[0], // Match the width of the main window
    height: titlebaroffset, // Set the height of the custom title bar
    parent: mainWindow,
    resizable: false,
    icon: __dirname + "/Icon.ico",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });


  // Load the content of your title bar (such as buttons, text, etc.)
  customTitleBar.loadFile('browser.html'); // Replace with your custom title bar content file
  mainWindow.setPosition(mainWindow.getPosition()[0], mainWindow.getPosition()[1] + titlebaroffset);
  // Position the custom title bar above the main window
  customTitleBar.setPosition(mainWindow.getPosition()[0], mainWindow.getPosition()[1] - titlebaroffset);

  // Remove the menu bar from the main window if you prefer
  mainWindow.removeMenu();


  // IPC handlers for window actions
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  var previousbounds = null;
  ipcMain.on('maximize-window', () => {
    if (isMaximized) {
      mainWindow.setBounds(previousbounds);
      isMaximized = false;
    } else {

      previousbounds = mainWindow.getBounds();
      mainWindow.setBounds({
        width: screenWidth,
        height: screenHeight - titlebaroffset,
        x: 0,
        y: titlebaroffset
      });
      isMaximized = true;
    }
  });


  ipcMain.on('close-window', () => {
    mainWindow.close();
  });
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  var originalBounds;
  ipcMain.on('drag:start', () => {
    isDragging = true;
    const cursorPosition = screen.getCursorScreenPoint();
    const windowPosition = mainWindow.getPosition();
    dragOffsetX = cursorPosition.x - windowPosition[0];
    dragOffsetY = cursorPosition.y - windowPosition[1];
    originalBounds = mainWindow.getBounds();
  });

  ipcMain.on('drag:move', () => {
    if (isDragging) {
      const cursorPosition = screen.getCursorScreenPoint();
      const newX = cursorPosition.x - dragOffsetX;
      const newY = cursorPosition.y - dragOffsetY;
      const { width, height } = originalBounds;
      mainWindow.setBounds({
        x: newX,
        y: newY,
        width: width,
        height: height
      });
    }
  });

  ipcMain.on('drag:end', () => {
    isDragging = false;
  });

  ipcMain.handle('closetab', async (event, tab) => {
    console.log(tab);
    const windowsToClose = [];
    const urls = [];

    let rightClickPosition = null

    windows.forEach(window => {

      const currentUrl = window.webContents.getURL();
      urls.push(currentUrl);
      if (areSameUrls(currentUrl, tab)) {
        windowsToClose.push(window);
      }
    });

    if (windowsToClose.length === 0) {
      const closestMatchUrl = closest_match.closestMatch(tab, urls);
      windows.forEach(window => {
        const currentUrl = window.webContents.getURL();
        if (currentUrl === closestMatchUrl || extractDomain(currentUrl) === extractDomain(closestMatchUrl)) {
          windowsToClose.push(window);
        }
      });
    }

    windowsToClose.forEach(window => {
      const index = windows.indexOf(window);
      windows = windows.filter(win => win !== window);
      window.destroy();
      fullscreen.splice(index, 1);
    });

    if (windows.length === 0) {
      setTimeout(async () => {
        await customTitleBar.webContents.executeJavaScript(`
          LoadNewLink("https://google.com/");
        `);
      }, 500);
    }

  });



  function areSameUrls(url1, url2) {
    const cleanUrl1 = extractDomainAndPath((url1));
    const cleanUrl2 = extractDomainAndPath((url2));

    return cleanUrl1 == cleanUrl2;
  }

  function extractDomain(url) {
    const cleanUrl = url.replace(/(https?:\/\/)?(www\.)?/, ''); // Remove 'http(s)://' and 'www.' prefixes
    const urlParts = cleanUrl.split('/'); // Split the URL into domain and path
    return urlParts[0];
  }

  function extractDomainAndPath(url) {
    const cleanUrl = url.replace(/(https?:\/\/)?(www\.)?/, ''); // Remove 'http(s)://' and 'www.' prefixes
    const urlParts = cleanUrl.split('/'); // Split the URL into domain and path
    if (urlParts[1]) {
      return urlParts[0] + urlParts[1];
    }
    else {
      return urlParts[0];
    }
  }




  windows = [];
  fullscreen = [];
  ipcMain.handle('newpage', async (event, url) => {
    createnewpage(url);
    await customTitleBar.webContents.executeJavaScript(`
              createTab("${url}");
              newpage("${url}")
            `);
  });

  function createnewpage(url) {
    var alreadyexists = false;
    windows.forEach(window => {
      if (areSameUrls(window.webContents.getURL(), url)) {
        window.focus();
        alreadyexists = true;
      }
    });
    if (!alreadyexists) {
      const newWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        frame: false,
        parent: mainWindow,
      });
      newWindow.setBounds({
        width: mainWindow.getSize()[0] + windowsize,
        height: mainWindow.getSize()[1] + windowsize,
        x: mainWindow.getPosition()[0],
        y: mainWindow.getPosition()[1]
      });
      newWindow.loadURL(url); console.log("loaded: ", url)
      windows.push(newWindow);
      fullscreen.push(false);
      newWindow.on('closed', () => {
        windows = windows.filter(window => window !== newWindow);
      });
    }
  }


  async function replacetabs() {

    windows.forEach(window => {

      keeptab = false;
      customTitleBar.webContents.executeJavaScript("tabs").then((tabsValue) => {
        tabsValue.forEach((tab, index) => {
          if (extractDomain(window.webContents.getURL()) == (extractDomain(tab))) {
            keeptab = true;
          }
        });
        if (!keeptab) {
          const index = windows.indexOf(window);
          windows = windows.filter(win => win !== window);
          window.destroy();
          fullscreen.splice(index, 1);
        }
      }).catch((error) => {
        console.error(error);
      });




      window.webContents.removeAllListeners("did-navigate-in-page");
      window.webContents.removeAllListeners("will-navigate");
      window.webContents.removeAllListeners("did-navigate");
      window.webContents.removeAllListeners("will-redirect");
      window.webContents.on('did-navigate-in-page', async (event, url) => {
        const mainWindowURL = window.webContents.getURL();
        if (url.startsWith(mainWindowURL)) {
          console.log(url);
          try {
            await customTitleBar.webContents.executeJavaScript(`
              ReplaceTab("${url}", currentpage);
            `);
          } catch (error) {
            console.error(error);
          }
        }
      });

      window.webContents.on('will-navigate', async (event, url) => {
        const mainWindowURL = window.webContents.getURL();
        if (url.startsWith(mainWindowURL)) {
          console.log(url);
          try {
            await customTitleBar.webContents.executeJavaScript(`
              ReplaceTab("${url}");
            `);
          } catch (error) {
            console.error(error);
          }
        }
      });

      window.webContents.on('did-navigate', async (event, url) => {
        const mainWindowURL = window.webContents.getURL();
        if (url.startsWith(mainWindowURL)) {
          console.log(url);
          try {
            await customTitleBar.webContents.executeJavaScript(`
              ReplaceTab("${url}");
            `);
          } catch (error) {
            console.error(error);
          }
        }
      });

      window.webContents.on('will-redirect', async (event, url) => {
        const mainWindowURL = window.webContents.getURL();
        if (url.startsWith(mainWindowURL)) {
          console.log(url);
          try {
            await customTitleBar.webContents.executeJavaScript(`
              ReplaceTab("${url}");
            `);
          } catch (error) {
            console.error(error);
          }
        }
      });
    });
  }
  const intervalId = setInterval(replacetabs, 1000);

  var isMaximized = false;
  function setBoundstitlebar() {
    try {
      customTitleBar.setBounds({
        width: mainWindow.getSize()[0],
        height: titlebaroffset,
        x: mainWindow.getPosition()[0],
        y: mainWindow.getPosition()[1] - titlebaroffset
      });

      if (isMaximized) {
        isMaximized = false;
      }

      windows.forEach(window => {
        fullscreen[windows.indexOf(window)] = window.isFullScreen();
        if (!fullscreen[windows.indexOf(window)]) {

          window.setBounds({
            width: mainWindow.getSize()[0] + windowsize,
            height: mainWindow.getSize()[1] + windowsize,
            x: mainWindow.getPosition()[0] - parseInt(windowsize / 2),
            y: mainWindow.getPosition()[1] - parseInt(windowsize / 2)
          });
        }
        else {
          window.setBounds({
            width: screenWidth,
            height: screenHeight,
            x: 0,
            y: 0
          });
        }
      });
    } catch {

    }
  }
  const intervalId2 = setInterval(setBoundstitlebar, 1);

}

app.whenReady().then(createWindow);
