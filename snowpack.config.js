// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  alias: {
    "react": "preact/compat",
    "react-dom": "preact/compat"
  },
  mount: {
    "src": "/"
  },
  plugins: [
  ],
  packageOptions: {
    source: "local",
    types: true
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  }
};
