var fs = require('fs');
var message = require('../util/message');
var UglifyJS = require("uglify-js");
var config,root;

module.exports = function(program) {
  config = require('../util/config')();
  root = config.appDir;
  checkApplication();
  createMinify();
};

function checkApplication(){
  try {
    stats = fs.lstatSync(rootify('javascripts/application.js')); // throws if path doesn't exist
  } catch (e) {
    message.error("-> application.js file was not found, it is necessary to build, please run the command: ember server");
    return;
  }
  return;
}

function createMinify() {
  compressed_file = rootify('javascripts/application.min.js');
  fs.exists(compressed_file, function(exist) {
    if(exist){
      message.removeFile("javascripts/application.min.js");
      fs.unlink(compressed_file, function (error) {
        if (error) throw new Error(error);
        minify(compressed_file);
      });
    } else {
      minify(compressed_file);
    }
  });
}

function minify(compressed_file){
  message.notify("-> Minify: create application.min.js");
  minify = UglifyJS.minify(rootify('javascripts/application.js')).code;
  fs.writeFile(rootify('javascripts/application.min.js'), minify, function (error) {
    if (error) throw new Error(error);
    message.fileCreated("javascripts/application.min.js");
  });
}

function rootify(path) {
  return root + '/' + path;
}

