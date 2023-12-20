/* All window creation functions */
const { BrowserWindow, BrowserView, ipcMain, app, screen } = require("electron");
const windowStateKeeper = require("electron-window-state");
const appdir = app.getAppPath();
const path = require('path');


function getScreenSize() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const screenWidth = primaryDisplay.bounds.width;
    const screenHeight = primaryDisplay.bounds.height;

    return { width: screenWidth, height: screenHeight };
}


/* Window functions */
function createMainWindow() {
    /*const SplashWindow = (global.SplashWindow = new BrowserWindow({
        width: 390,
        height: 370,
        frame: false,
        transparent: false,
        resizeable: false,
        center: true,
        icon: `${appdir}/src/renderer/img/app.png`,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    }));*/
    //SplashWindow.loadFile(`${appdir}/src/renderer/splash.html`);
    //SplashWindow.webContents.openDevTools();
    const mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 700,
        fullScreen: false,
        maximize: true
    });
    const mainWindow = (global.mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        frame: false,
        center: true,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(appdir, 'src', 'renderer', 'js', 'preload.js'),
        },
    }));
    mainWindowState.manage(mainWindow);
    mainWindow.loadFile(path.join(appdir, 'src', 'renderer', 'titlebar.html'));
    //mainWindow.webContents.openDevTools();
    mainWindow.hide();
    const PageView = (global.PageView = new BrowserView({
        webPreferences: {
            webviewTag: true,
            contextIsolation: true,
            preload: path.join(appdir, 'src', 'renderer', 'js', 'preload.js')
        }
    }));
    mainWindow.setBrowserView(PageView);
    PageView.webContents.loadFile(path.join(appdir, 'src', 'renderer', 'browser.html'));
    PageView.setBounds({
        x: 0,
        y: Math.round((getScreenSize().height / 100) * 5) - Math.round((getScreenSize().height / 100) * 1),
        width: mainWindow.getBounds().width - Math.round((getScreenSize().width / 100) * 1),
        height: mainWindow.getBounds().height - Math.round((getScreenSize().height / 100) * 5) - Math.round((getScreenSize().height / 100) * 1),
    });
    mainWindow.on("resize", () => {
        PageView.setBounds({
            x: 0,
            y: Math.round((getScreenSize().height / 100) * 5),
            width: mainWindow.getBounds().width,
            height: mainWindow.getBounds().height - Math.round((getScreenSize().height / 100) * 5),
        });
    });

    /* Buttons */
    mainWindow.on("maximize", () => {
        mainWindow.webContents.send("window.maximized");
        PageView.webContents.send("window.maximized");
        PageView.setBounds({
            x: 0,
            y: Math.round((getScreenSize().height / 100) * 5) - Math.round((getScreenSize().height / 100) * 1),
            width: mainWindow.getBounds().width - Math.round((getScreenSize().width / 100) * 1),
            height: mainWindow.getBounds().height - Math.round((getScreenSize().height / 100) * 5) - Math.round((getScreenSize().height / 100) * 1),
        });
    });
    mainWindow.on("unmaximize", () => {
        mainWindow.webContents.send("window.restored");
        PageView.webContents.send("window.restored");
    });
    ipcMain.on("window.minimize", (event) => {
        mainWindow.minimize();
    });
    ipcMain.on("window.maximize", (event) => {
        mainWindow.maximize();
        event.sender.send("window.maximized");
    });
    ipcMain.on("window.restore", (event) => {
        mainWindow.unmaximize();
        event.sender.send("window.restored");
    });
    ipcMain.on("window.close", () => {
        mainWindow.close();
        app.quit();
    });

    /* Fix for when window was last saved in maximised but started normal */
    if (mainWindowState.isMaximized == true) {
        mainWindow.webContents.send("window.maximized");
        mainWindow.webContents.executeJavaScript("document.getElementById('maximize').style.display = 'none'; && document.getElementById('restore').style.display = 'flex';");
    };
}

/* Export functions */
module.exports = { createMainWindow };