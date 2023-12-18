/* All window creation functions */
const { BrowserWindow, BrowserView, ipcMain, app } = require("electron");
const windowStateKeeper = require("electron-window-state");
const appdir = app.getAppPath();
const path = require('path');

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
        minWidth: 1200, //1000
        minHeight: 700,
        frame: false,
        center: true,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(appdir, 'src', 'renderer', 'js', 'preload-titlebar.js'),
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
        y: 40,
        width: mainWindow.getBounds().width,
        height: mainWindow.getBounds().height - 40
    });
    //PageView.webContents.openDevTools();
    mainWindow.on("resize", () => {
        PageView.setBounds({
            x: 0,
            y: 40,
            width: mainWindow.getBounds().width,
            height: mainWindow.getBounds().height - 40,
        });
    });

    /* Buttons */
    mainWindow.on("maximize", () => {
        mainWindow.webContents.send("window.maximized");
    });
    mainWindow.on("unmaximize", () => {
        mainWindow.webContents.send("window.restored");
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
        mainWindow.webContents.executeJavaScript("document.getElementById('maximize').style.display = 'none';");
        mainWindow.webContents.executeJavaScript("document.getElementById('restore').style.display = 'flex';");
    };
}

/* Export functions */
module.exports = { createMainWindow };