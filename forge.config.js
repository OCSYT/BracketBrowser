module.exports = {
  packagerConfig: {
    asar: true,
    protocols: [
      {
        name: "http",
        schemes: ["http"]
      },
      {
        name: "https",
        schemes: ["https"]
      },
      {
        name: "file",
        schemes: ["file"]
      }
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'BracketBrowser',
        title: 'Bracket Browser',
        appBundleId: 'com.bracketproto.bracketbrowser',
        overwrite: true,
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
      config: {
        // Set the App ID for macOS
        appBundleId: 'com.bracketproto.bracketbrowser',
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        // Set the App ID for Debian/Ubuntu
        options: {
          maintainer: 'oxmc',
          homepage: 'https://oxmc.is-a.dev/?ref=bbdeb',
          vendor: 'BracketProto',
          name: 'bracket-browser',
        },
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        // Set the App ID for Red Hat/Fedora
        options: {
          maintainer: 'oxmc',
          homepage: 'https://oxmc.is-a.dev/?ref=bbrpm',
          vendor: 'BracketProto',
          name: 'bracket-browser',
        },
      }
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    }
  ]
};