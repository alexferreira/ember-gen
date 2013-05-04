var fs = require('fs');
var YAML = require('yamljs');
var message = require('./message');

module.exports = function() {
  if (fs.existsSync('config/app.yml')) {
    return YAML.load('config/app.yml');
  } else {
    message.notify("ember: could not find `config/app.yml` file, please run `ember new [appDir]`");
    return process.exit();
  }
};