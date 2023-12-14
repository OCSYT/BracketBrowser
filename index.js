const { app, BrowserWindow, ipcMain, screen, protocol, session  } = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');



contextMenu({
  showSaveImageAs: true
});



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
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    },
  });
  mainWindow.loadFile('browser.html');
  mainWindow.removeMenu();

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

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
      mainWindow.setBounds({x: newX, y: newY, width: prevbounds.width, height: prevbounds.height});
    }
  });

  ipcMain.on('drag:end', () => {
    isDragging = false;
  });

  ipcMain.handle('newpage', async (event, url) => {

  });
  return mainWindow;
}

function loadnewpage(url){
  mainWindow.webContents.executeJavaScript(`LoadNewLink(${url})`)
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.whenReady().then(() => {

  // Create the Electron window
  const mainWindow = createWindow();
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