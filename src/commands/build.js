var exec = require('child_process').exec;
var fs = require('fs');
var handlebars = require('handlebars');
var message = require('../util/message');
var UglifyJS = require("uglify-js");
var appDirs = require('../util/appDirs');
var template = require('../util/template');
var inflector = require('../util/inflector');
var walk = require('walk').walkSync;
var precompile = require('../util/precompile');
var findit = require('findit');
var config,root;

module.exports = function(program) {
  config = require('../util/config')();
  root = config.appDir;
  checkApplication();
  precompile(rootify('templates'), rootify('templates.js'), function() {
    createIndex().then(build).then(createMinify);
  });
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

function createIndex() {
  var modules = [];
  var helpers = [];
  appDirs.forEach(function(dirName) {
    if (dirName == 'templates') return;
    var dirPath = rootify(dirName);
    var walker = walk(dirPath);
    walker.on('file', function(dir, stats, next) {
      if (stats.name.charAt(0) !== '.') {
        var path = unroot(dir + '/' + stats.name).replace(/\.js$/, '');
        if (dirName == 'helpers') {
          helpers.push({path: path});
        } else {
          var name = inflector.objectify(path.replace(dirName, ''));
          modules.push({
            namespace: config.namespace,
            objectName: name,
            path: path
          });
        }
      }
      next();
    });
  });

  return template.write(
    'build/index.js',
    rootify('index.js'),
    {modules: modules, helpers: helpers, namespace: config.namespace, reload: false},
    true
  );
}

function build() {
  var command = __dirname + '/../../node_modules/browserbuild/bin/browserbuild ' +
                "-m index -b " + root + "/ `find "+ root + " -name '*.js'` > " +
                rootify('javascripts/application.js');
  exec(command, function (error, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
    if (error) throw new Error(error);
    cleanup();
  });
}

function cleanup() {
  // fs.unlink(rootify('index.js'));
  // fs.unlink(rootify('templates.js'));
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
    cleanup();
  });
}


function rootify(path) {
  return root + '/' + path;
}

function unroot(path) {
  return path.replace(root + '/', '');
}

