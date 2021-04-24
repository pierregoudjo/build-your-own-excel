// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    "src": "/"
  },
  plugins: [
  ],
  packageOptions: {
    source: "remote-next",
    types: true
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  },
  dependencies: {
    "fp-ts": "*",
    "htm": "",
    "parsimmon": "*",
    "@types/parsimmon": "*",
    "preact": "*",
    "unistore": "*"
  }
};
