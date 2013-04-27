var fs = require('../util/fs-promised');
var rsvp = require('rsvp-that-works');
var message = require('../util/message');
var template = require('../util/template');
var root = '.';
var libPath = __dirname + '/../../packages';

module.exports = function(path, env) {
  message.notify("-> Updating packages.");
  return copyLibs()
};

function mkdir(path) {
  return mkdirUnlessExists(rootify(path));
}

function copyLibs() {
  return mkdir('vendor').then(function() {
    return fs.readdir(libPath).then(function(libs) {
      return rsvp.all(libs.map(copyLib));
    });
  });
}

function copyLib(name) {
  var targetPath = rootify('vendor/' + name);
  var packagePath = libPath + '/' + name;
  return fs.exists(targetPath).then(function(exists){
    return fs.readFile(packagePath).then(function(fileData) {
      var src = fileData.toString();
      return fs.writeFile(targetPath, src).then(function() {
        message.fileUpdated(targetPath);
      }, error);
    });
  });
}

function rootify(path) {
  return root + '/' + path;
}

function error(err) {
  throw new Error(err);
}

function mkdirUnlessExists(path) {
  return fs.exists(path).then(function(exists) {
    if (exists) {
      message.fileExists(path);
      return exists;
    } else {
      message.fileCreated(path);
      return fs.mkdir(path);
    }
  });
}
