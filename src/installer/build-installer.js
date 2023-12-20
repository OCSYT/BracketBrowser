/* Node Modules */
const { createHash } = require('crypto');
const { join } = require('path');
const { readFileSync, writeFileSync } = require('fs');
const innosetupCompiler = require('innosetup-compiler');

/* Supported architectures */
const supportedArchitectures = ['x64', 'arm64', 'ia32'];

/* Parse command-line arguments */
const args = process.argv.slice(2);
const arch = args.includes('--arch') ? args[args.indexOf('--arch') + 1] : null;
const buildAll = args.includes('--all');
const isOnline = args.includes('--online');

/* Check if a valid architecture is specified or if we are building the online installer */
if (isOnline && arch !== null) {
  console.warn('Ignoring --arch when --online is set.');
} else if (arch !== null && !supportedArchitectures.includes(arch)) {
  console.error('Invalid architecture specified. Supported architectures: ' + supportedArchitectures.join(', '));
  process.exit(1);
} else if (arch === null && !buildAll && !isOnline) {
  console.error('No architecture specified. Please use --arch <architecture> or --all to build all, or if you\'re trying to build the online installer use --online');
  process.exit(1);
}

/* Info */
const exeDir = join(__dirname, '../', '../', 'dist/');

/* Compile for specified architecture or all architectures */
const architecturesToBuild = buildAll ? [...supportedArchitectures, 'online'] : (isOnline ? [] : (arch ? [arch] : supportedArchitectures));

/* Function to build the installer for a specific architecture */
const buildInstaller = async (currentArch) => {
  const exePath = join(exeDir, `BracketBrowser-win32-${currentArch}/`, 'BracketBrowser.exe');
  const setupScriptPath = join(__dirname, currentArch === 'online' ? 'online-installer.iss' : `win32-${currentArch}.iss`);
  var setupScriptContent = readFileSync(setupScriptPath, 'utf-8');
  const setupIssPath = join(exeDir, 'Setup.iss');

  try {
    console.log(`Compiling for ${currentArch}:`);
    await new Promise((resolve, reject) => {
      /* Update the setup script */
      setupScriptContent = setupScriptContent.replace("../renderer/img/BracketBrowser.ico", "../src/renderer/img/BracketBrowser.ico").replace("splash.bmp", "../src/installer/splash.bmp").replace(new RegExp("../../dist/", "g"), "./");
      if (currentArch !== 'online') {
        /* Generate the SHA-256 hash */
        const hash = createHash('sha256')
          .update(readFileSync(exePath))
          .digest('hex');
        /* replace the placeholder hash */
        setupScriptContent = setupScriptContent.replace('{{BROWSEREXEHASH}}', hash);
      }
      /* Read the setup script and create a new one in the dist folder */
      writeFileSync(setupIssPath, setupScriptContent, 'utf-8');
      innosetupCompiler(setupIssPath, { gui: false, verbose: true })
        .then(() => {
          console.log(`Compilation for ${currentArch} completed successfully.`);
          resolve();
        })
        .catch((error) => {
          console.error(`Error compiling for ${currentArch}:`, error);
          reject(error);
        });
    });
  } catch (error) {
    console.error(`Error compiling for ${currentArch}:`, error);
  }
};

/* Build installers sequentially */
const buildSequentially = async () => {
  for (const currentArch of architecturesToBuild) {
    await buildInstaller(currentArch);
  }
};

/* Run the sequential build */
buildSequentially();