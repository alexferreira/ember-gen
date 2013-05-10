var exec = require('child_process').exec;
var fs = require('fs');
var message = require('../util/message');
var walk = require('walk').walkSync;
var appDirs = require('../util/appDirs');
var template = require('../util/template');
var inflector = require('../util/inflector');
var config,root;

module.exports = function(program) {
  config = require('../util/config')();
  root = config.app.appDir;
  vendor = config.vendor;
  checkApplication();
  createIndex().then(build);
};

function checkApplication(){
  try {
    stats = fs.lstatSync(rootify('assets/application.js')); // throws if path doesn't exist
  } catch (e) {
    message.error("-> application.js file was not found, it is necessary to build, please run the command: ember server");
    return;
  }
  return;
}

function createIndex() {
  var modules = [];
  var helpers = [];
  var vendors = [];

  vendor.forEach(function(file) {
    vendors.push({path: 'vendor/'+file});
  }); 
  
  appDirs.forEach(function(dirName) {
    if (dirName == 'templates' || dirName == 'config') return;
    var dirPath = rootify(dirName);
    var walker = walk(dirPath);
    walker.on('file', function(dir, stats, next) {
      if (stats.name.charAt(0) !== '.' && stats.name.match(/\.js$/)) {
        var path = unroot(dir + '/' + stats.name).replace(/\.js$/, '');
        if (dirName == 'assets') return;
        if (dirName == 'vendor') return;
        if (dirName == 'helpers') {
          console.log();
          helpers.push({path: path});
        } else {
          var name = inflector.objectify(path.replace(dirName, ''));
          modules.push({
            namespace: config.app.namespace,
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
    {modules: modules, helpers: helpers, namespace: config.app.namespace, reload: false, vendors: vendors},
    true
  );
}

function build() {
  var savePath = rootify('assets/application.min.js');
  var command = __dirname + '/../../node_modules/browserbuild/bin/browserbuild ' +
                "-c -m index -b " + root + "/ `find "+ root + " -name '*.js' -not -path './assets/*'` > " +
                savePath;
  message.notify("-> Minify: create application.min.js");                
  exec(command, function (error, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
    if (error) throw new Error(error);
    message.fileCreated("assets/application.min.js");
  });
}

function rootify(path) {
  return root + '/' + path;
}

function unroot(path) {
  return path.replace(root + '/', '');
}