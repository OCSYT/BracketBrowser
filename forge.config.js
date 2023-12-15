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
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};