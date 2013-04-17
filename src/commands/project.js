var fs = require('../util/fs-promised');
var rsvp = require('rsvp-that-works');
var message = require('../util/message');
var appDirs = require('../util/appDirs');
var template = require('../util/template');
var root = '.';
var libPath = __dirname + '/../../packages';
var stylesheetPath = __dirname + '/../templates/create/stylesheets';

module.exports = function(path, env) {
  message.notify("-> Creating application files and directories");

  var env = arguments[arguments.length - 1];
  root = arguments.length > 1 ? path : root;
  var template = env.template || 'clean';

  files = [
    'index_'+template+'.html',
    'app.js',
    'store.js',
    'routes.js',
    'functions.js',
    'templates_'+template+'/application.hbs',
    'templates_'+template+'/index.hbs'
  ];

  emberFileParams = {
    appDir: '.',
    namespace: env.namespace || 'App', 
    template: template,
    modules: 'cjs'
  };

  return makeRootDirectory().
    then(makeEmberFile(emberFileParams)).
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

function makeEmberFile(params) {
  var ember = rootify('.ember');
  return template.write('create/ember', ember, params);
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
