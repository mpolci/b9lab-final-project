module.exports = {
  build: {
    "index.html": "index.html",
    "app.js": [
      "javascripts/app.js"
    ],
    "angularapp.js": [
      "javascripts/controlAccount.js",
      "javascripts/filters.js",
      "javascripts/fundingHub.service.js",
      "javascripts/fundingHub.controller.js",
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    // "images/": "images/"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
