var exec = require('child_process').exec;
var fs = require('fs');
var fsp = require('../util/fs-promised');
var message = require('../util/message');
var walk = require('walk').walkSync;
var appDirs = require('../util/appDirs');
var template = require('../util/template');
var inflector = require('../util/inflector');
var cleanCSS = require('clean-css');
var stylus = require('stylus');
var _ = require('underscore');
var config,root;

module.exports = function(program) {
  config = require('../util/config')();
  root = config.app.appDir;
  vendor = config.vendor;
  checkApplication();
  createVendor().then(createIndex).then(buildCss).then(buildVendor).then(build);
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

function createVendor() {
  var vendors = [];

  vendor.forEach(function(file) {
    vendors.push({path: file});
  });

  return template.write(
    'build/vendors.js',
    rootify('vendor/index.js'),
    {vendors: vendors},
    true
  );
}

function createIndex() {
  var modules = [];
  var helpers = [];

  appDirs.forEach(function(dirName) {
    if (dirName == 'templates' || dirName == 'config') return;
    var dirPath = rootify(dirName);
    var walker = walk(dirPath);
    walker.on('file', function(dir, stats, next) {
      if (stats.name.charAt(0) !== '.' && stats.name.match(/\.js$/)) {
        var path = unroot(dir + '/' + stats.name).replace(/\.js$/, '');
        if (dirName == 'assets') return;
        if (dirName == 'vendor') return;
        if (dirName == 'test') return;
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
    {modules: modules, helpers: helpers, namespace: config.app.namespace, reload: false},
    true
  );
}

function buildCss() {
  var cssUncompress, minimized;
  savePath = rootify('assets/application.min.css');

  var out = config.stylesheets.map(function(cssFile){
    filePath = './stylesheets/'+cssFile
    return fs.readFileSync(filePath, 'utf-8');
  }).join('\n')

  stylesheetsPath = _.chain(config.stylesheets)
                    .map(function(path){
                      var path = _.initial(path.split('/'));
                      return path == 0 ? './stylesheets' : './stylesheets/'+path.join('/');
                    })
                    .value()

  return stylus(out)
    .set('paths', stylesheetsPath)
    .render(function(err, css){
      if (err) throw err;
      message.notify("-> Minify: create application.min.css");
      minimized = cleanCSS.process(css, {keepSpecialComments: 0, keepBreaks: false, removeEmpty: false});

      fsp.exists(savePath).then(function(exist){
        if(exist) return fs.unlinkSync(savePath)
      }).then(function(path){
        fsp.createFile(savePath).then(function() {
          return fsp.writeFile(savePath, minimized).then(function() {
            message.fileCreated(savePath);
          }, fsp.error);
        }, fsp.error);
      });
    });
}

function buildVendor() {
  var savePath = rootify('assets/vendors.min.js');
  var command = __dirname + '/../../node_modules/browserbuild/bin/browserbuild ' +
                "-c -m index -b vendor/ `find vendor -name '*.js'` > " +
                savePath;
  message.notify("-> Minify: create vendor.min.js");
  exec(command, function (error, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
    if (error) throw new Error(error);
    message.fileCreated(savePath);
  });
}

function build() {
  var savePath = rootify('assets/application.min.js');
  var command = __dirname + '/../../node_modules/browserbuild/bin/browserbuild ' +
                "-c -m index -b " + root + "/ `find "+ root + " -name '*.js' -not -path './assets/*' -not -path './vendor/*'` > " +
                savePath;
  message.notify("-> Minify: create application.min.js");
  exec(command, function (error, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
    if (error) throw new Error(error);
    message.fileCreated(savePath);
  });
}

function rootify(path) {
  return root + '/' + path;
}

function unroot(path) {
  return path.replace(root + '/', '');
}