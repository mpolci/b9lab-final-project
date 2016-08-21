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
      "javascripts/controllers.js",
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    // "images/": "images/"
    "views/": "views/"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
