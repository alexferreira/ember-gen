var fs = require('../util/fs-promised');
var rsvp = require('rsvp-that-works');
var message = require('../util/message');
var appDirs = require('../util/appDirs');
var template = require('../util/template');
var root = '.';
var libPath = __dirname + '/../../packages';
var stylesheetPath = __dirname + '/../templates/create/stylesheets';

var files = [
  'index.html',
  'app.js',
  'store.js',
  'routes.js',
  'functions.js',
  'templates/application.hbs',
  'templates/index.hbs'
];

module.exports = function(program) {
  root = program.args[0] || root;
  namespace = program.args[1].namespace || 'App';

  message.notify("-> Creating application files and directories");

  return makeRootDirectory().
    then(makeEmberFile).
    then(mkdirs).
    then(createFiles).
    then(copyLibs).
    then(copyStylesheets).
    then(createJavascriptsFolder);
};

function makeRootDirectory() {
  return mkdirUnlessExists(root);
}

function mkdirs() {
  return rsvp.all(appDirs.map(mkdir));
}

function mkdir(path) {
  return mkdirUnlessExists(rootify(path));
}

function createFiles() {
  return rsvp.all(files.map(createFile));
}

function createFile(name) {
  var path = rootify(name);
  return template.write('create/' + name, path);
}

function createJavascriptsFolder() {
  return mkdir('javascripts')
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
    if (exists) {
      message.fileExists(targetPath);
      return exists;
    }
    return fs.readFile(packagePath).then(function(fileData) {
      var src = fileData.toString();
      return fs.writeFile(targetPath, src).then(function() {
        message.fileCreated(targetPath);
      }, error);
    });
  });
}

function copyStylesheets() {
  return mkdir('stylesheets').then(function() {
    return fs.readdir(stylesheetPath).then(function(stylesheets) {
      return rsvp.all(stylesheets.map(copyStylesheet));
    });
  });
}

function copyStylesheet(name) {
  var targetPath = rootify('stylesheets/' + name);
  var packagePath = stylesheetPath + '/' + name;
  return fs.exists(targetPath).then(function(exists){
    if (exists) {
      message.fileExists(targetPath);
      return exists;
    }
    return fs.readFile(packagePath).then(function(fileData) {
      var src = fileData.toString();
      return fs.writeFile(targetPath, src).then(function() {
        message.fileCreated(targetPath);
      }, error);
    });
  });
}

function makeEmberFile() {
  var ember = rootify('.ember');
  return template.write('create/ember', ember, {
    appDir: '.',
    namespace: namespace,
    modules: 'cjs'
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
