/* Node modules */
const { ipcRenderer, ipcMain } = require('electron');
const { app, BrowserWindow } = require('@electron/remote');
var os = require('os');
const path = require('path');
const fs = require('fs');
const onezip = require('onezip');
var request = require('request');
const execFile = require('child_process').execFile;

/* Variables */
var packageJson = require(path.join(__dirname, '../../package.json'));
var appname = packageJson.name;
var config = require(path.join(__dirname, '../data/config.json'));
const userDataPath = app.getPath('userData');
var appfile, ltg, latest;

/*Elements*/
var progressText = document.getElementById("progress-text");
var downloadProgressText = document.getElementById("download-progress-text");
var progbar = document.getElementById("progbar");

/*Check for updates*/
ipcRenderer.on('SplashWindow', async function (event, arg) {
    //console.log(arg);
    if (arg == "Latest") {
        progressText.innerHTML = "No Launcher update found"
        downloadProgressText.innerHTML = "Loading..."
        setTimeout(async function () {
            ipcRenderer.send('FromSplashWindow', 'ShowMainWindow');
        }, 2000);
    } else if (arg == "Unknown") {
        progressText.innerHTML = "Unable to get latest version"
        downloadProgressText.innerHTML = "Loading..."
        setTimeout(function () {
            ipcRenderer.send('FromSplashWindow', 'ShowMainWindow');
        }, 3000);
    } else if (arg == "Update") {
        progressText.innerHTML = "Downloading Launcher Update..."
        switch (os.platform()) {
            case "win32":
                ltg = "win";
                break;
            case "linux":
                ltg = "linux";
                break;
            case "darwin":
                ltg = "mac";
                break;
        };
        progressText.innerHTML = "Downloading Launcher update..."
        if (os.platform() == "win32") {
            appfile = `${appname}-${os.arch()}.exe`;
        } else if (os.platform() == "darwin") {
            appfile = `${appname}-${os.arch()}.app`;
        } else if (os.platform() == "linux") {
            appfile = `${appname}-${os.arch()}.deb`;
        };
        console.log("Downloading latest version...");
        progressText.innerHTML = 'Downloading update...';
        progbardiv.style.display = "block";
        console.log(`OS type is: ${os.platform()}`);
        console.log(`Downloading '${appfile}' from '${config.updatelauncher}'`);

        // Save variable to know progress
        var received_bytes = 0;
        var total_bytes = 0;

        console.log(config.updatelauncher, appfile);

        try {
            var req = request({
                method: 'GET',
                uri: `${config.updatelauncher}/${appname}.zip`,
                headers: {
                    'UserAgent': `launchq2m; launcherVerion: ${packageJson.version}; ARCH: ${os.arch()}; PLATFORM: ${os.platform()};}`
                }
            });

            var out = fs.createWriteStream(path.join(userDataPath, 'update', `${appname}.zip`));
            req.pipe(out);

            req.on('response', function (data) {
                // Change the total bytes value to get progress later.
                //console.log(data.headers);
                total_bytes = parseInt(data.headers['content-length']);
            });

            req.on('data', function (chunk) {
                // Update the received bytes
                received_bytes += chunk.length;

                var percentage = (received_bytes * 100) / total_bytes;
                console.log(percentage.toFixed(2).split('.')[0].trim() + "% | " + received_bytes + " bytes out of " + total_bytes + " bytes.");

                console.log(percantage);
                if (typeof percentage == "NaN") {
                    downloadProgressText.innerHTML = `Unable to parse download percentage`;
                } else {
                    progbar.innerHTML = `${percentage.toFixed(2).split('.')[0].trim()}%`;
                    progbar.style = `width: ${percentage}%;`;
                    downloadProgressText.innerHTML = `${percentage.toFixed(2).split('.')[0].trim()}%`;
                };
            });

            req.on('end', function () {
                //alert("File succesfully downloaded");
                console.log("Successfully downloaded new update!");
                progressText.innerHTML = 'Download Complete!';
                out.end();
                setTimeout(async function () {
                    progressText.innerHTML = 'Extracting update...';
                    const extract = onezip.extract(path.join(userDataPath, 'update', `${appname}.zip`), path.join(userDataPath, 'update'));

                    extract.on('file', (name) => {
                        console.log(name);
                    });

                    extract.on('start', (percent) => {
                        console.log('extracting started');
                    });

                    extract.on('progress', (percent) => {
                        console.log(percent + '%');
                        if (percent == NaN) {
                            downloadProgressText.innerHTML = `Unable to parse extraction percentage`;
                        } else {
                            progbar.style = `width: ${percent}%;`;
                            downloadProgressText.innerHTML = `${percent}%`;
                            //progbar.innerHTML = `${percent}%`;
                        };
                    });

                    extract.on('error', (error) => {
                        console.error(error);
                        progressText.innerHTML = 'Error Extracting Update!';
                        //downloadProgressText.style.display = "none";
                        downloadProgressText.innerHTML = `Please try manualy downloading the update:<br><a href="${config.updatelauncher}" target="_blank" style="color: #DF6ADF;">${config.updatelauncher}</a><br><br><button class="btn br-4" onClick="app.quit();">Exit</button>`;
                        progbar.style.display = "none";
                    });

                    extract.on('end', () => {
                        console.log('done');
                        progressText.innerHTML = 'Extracted Update!';
                        setTimeout(async function () {
                            progbar.style.display = "none";
                            fs.unlink(path.join(userDataPath, 'update', `${appname}.zip`), (err) => {
                                if (err) throw err;
                                console.log(path.join(userDataPath, 'update', `${appname}.zip`) + " was deleted");
                                progressText.innerHTML = 'Updating...';
                                ipcRenderer.send('FromSplashWindow', 'Restart');
                            });
                        }, 3000);
                    });
                }, 3000);
            });
        } catch (e) {
            console.log(e);
            out.end();
        };
    }
})