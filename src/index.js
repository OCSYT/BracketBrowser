/* Nopde modules */
const { app, ipcMain, protocol, session } = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');
const axios = require('axios');

/* Info about app */
var appdir = app.getAppPath();
var appname = app.getName();
var appversion = app.getVersion();
//const config = require(`${appdir}/src/data/config.json`);
const userDataPath = app.getPath('userData');

/* Set context menu */
contextMenu({
  showSaveImageAs: true
});

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

/* Disable gpu and transparent visuals if not win32 or darwin */
if (process.platform !== "win32" && process.platform !== "darwin") { // TODO: Add option to enable or disable via user prefrences
  app.commandLine.appendSwitch("enable-transparent-visuals");
  app.commandLine.appendSwitch("disable-gpu");
  app.disableHardwareAcceleration();
};

/* Register protocols */
protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'https', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/* Main logic (internet check, updates, windows) */
require('@electron/remote/main').initialize();
/*if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('q2mgm', process.execPath, [path.resolve(process.argv[1])]);
  };
} else {
  app.setAsDefaultProtocolClient('q2mgm');
};*/
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', async (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    try {
      if (commandLine.length >= 3) {
        uri = commandLine[3].split('/');
      } else {
        uri = "none";
      };
    } catch (error) {
      uri = "none";
    };
    logger.debug("CommandLine:", commandLine);
    logger.debug("DeepLink:", commandLine[3]);
    logger.debug("DeepLink data:", uri);

    console.log(commandLine, commandLine[3], uri);

    switch (uri[2]) {
      case "oauth":
        console.log("Handle oauth");
        break;

      default:
        break;
    }

    app.on('open-url', async (event, url) => {
      uri = url.split('/');
      switch (uri[2]) {
        case "oauth":
          console.log("Handle oauth");
          break;

        default:
          break;
      }
    });

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      //app.quit();
    };
  });

  // Create mainWindow, load the rest of the app, etc...
  console.log("Checking for internet and getting updates");
  app.whenReady().then(async () => {
    /* Create windows */
    createMainWindow();
    //require("@electron/remote/main").enable(PageView.webContents);
    //require("@electron/remote/main").enable(AboutWindow.webContents);
    require("@electron/remote/main").enable(SplashWindow.webContents);
    /* Check for internet */
    checkInternet(function (isConnected) {
      if (isConnected) {
        SplashWindow.webContents.on("did-finish-load", () => {
          /* Get latest version */
          console.log("Initilize Updater:");
          axios.get("https://upd.oxmc.is-a.dev/projects/q2m/update.json").then(function (response) {
            //console.log(response);
            if (response.status == 200) {
              const onlineversion = response.data.version;
              console.log(`Online version: '${onlineversion}'`);
              console.log(`Local version: '${appversion}'`);
              /* If Online version is greater than local version, show update dialog */
              if (typeof onlineversion != 'undefined') {
                if (onlineversion > appversion) {
                  mainWindow.close();
                  console.log("\x1b[1m", "\x1b[31m", "Version is not up to date!", "\x1b[0m");
                  SplashWindow.webContents.send('SplashWindow', 'Update');
                } else {
                  console.log("\x1b[1m", "\x1b[32m", "Version is up to date!", "\x1b[0m");
                  SplashWindow.webContents.send('SplashWindow', 'Latest');
                };
              } else {
                console.log("\x1b[1m", "\x1b[31m", "Unable to check latest version from main server!\nvalue is not set.", "\x1b[0m");
                //notification("6");
                SplashWindow.webContents.send('SplashWindow', 'Unknown');
              };
            } else if (response.status == 404) {
              console.log("\x1b[1m", "\x1b[31m", "Unable to check latest version from main server!\nIt may be because the server is down, moved, or does not exist.", "\x1b[0m");
              //notification("6");
              SplashWindow.webContents.send('SplashWindow', 'Unknown');
            };
          }).catch(function (error) {
            // handle error
            console.log(error);
            console.log("\x1b[1m", "\x1b[31m", "Unable to check latest version from main server!\nIt may be because the server is down, moved, or does not exist.", "\x1b[0m");
            //notification("6");
            SplashWindow.webContents.send('SplashWindow', 'Unknown');
          });
        });
        ipcMain.on('FromSplashWindow', function (event, arg) {
          //console.log(arg);
          if (arg == "Restart") {
            if (os.platform() == "win32") {
              updatefile = path.join(userDataPath, 'update', `${appname}.exe`);
              var bbupd = spawn(updatefile, [], { detached: true, stdio: ['ignore', path.join(userDataPath, 'update', 'Q2M-UPDATE.log'), path.join(userDataPath, 'update', 'Q2M-UPDATE-ERROR.log')] });
              bbupd.unref();
              app.quit();
            } else if (os.platform() == "darwin") {
              updatefile = path.join(userDataPath, 'update', `${appname}.app`);
              /* overwrite app file */
              app.quit();
            } else if (os.platform() == "linux") {
              updatefile = path.join(userDataPath, 'update', `${appname}.deb`);
              var bbupd = spawn(`sudo dpkg -i -y ${updatefile}`, [], { detached: true, stdio: ['ignore', '/var/log/q2m/update.log', '/var/log/q2m/update-err.log'] });
              bbupd.unref();
              app.quit();
            };
          } else if (arg == "ShowMainWindow") {
            //PageView.webContents.on("did-finish-load", () => {
            //  console.log("Page loaded");
            //});
            console.log("Loading complete, Showing main window.");
            mainWindow.show();
            SplashWindow.close();
            mainWindow.center();
          };
        });
        ipcMain.handle('newpage', async (event, url) => {

        });
      } else {
        /* User not connected */
        console.log("\x1b[1m", "\x1b[31m", "ERROR: User is not connected to internet, showing NotConnectedNotification", "\x1b[0m");
        //notification("3");
        SplashWindow.webContents.on("did-finish-load", () => {
          SplashWindow.webContents.send('SplashWindow', 'Unknown');
          ipcMain.on('FromSplashWindow', function (event, arg) {
            if (arg == "ShowMainWindow") {
              console.log("Loading complete, Showing main window.");
              //PageView.webContents.loadFile(`${appdir}/src/renderer/notconnected.html`);
              mainWindow.show();
              SplashWindow.close();
              mainWindow.center();
            };
          });
        });
      };
    });
  });
};

/* If all windows are closed, quit app, exept if on darwin */
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

/* Before app closes */
app.on("before-quit", function () {

});

/* App ready */
app.on('ready', () => {
  /* Create windows and tray */
  /*if (global.mainWindow.getAllWindows().length === 0) {
    createMainWindow();
    //createTray();
  } else {
    global.mainWindow && global.mainWindow.focus();
  }*/
  /*PageView.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });*/
});