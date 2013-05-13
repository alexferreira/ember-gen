var exec = require('child_process').exec;
var fsp = require('../util/fs-promised');
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
var YAML = require('yamljs');
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var http = require("http");
var path = require("path");
var config,root;

module.exports = function(program, test) {
  var env = arguments[arguments.length - 1];
  config = require('../util/config')();
  port = env.port;
  init = env.init;
  root = config.app.appDir;
  vendor = config.vendor;

  mimeTypes = {"html": "text/html", "jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "js": "text/javascript", "css": "text/css"};

  precompile(rootify('templates'), rootify('templates.js'), function() {
    locales().then(createIndex).then(concatCss).then(build).then(start_server).then(watch);
  });
};

module.exports.close = function(callback){
  this.server().close(callback);
}

function start_server(){
  if(init) server().listen(port, "127.0.0.1", function(){
    console.log("Server running at http://127.0.0.1:"+port+"/");
  });
}

function server(){
  return http.createServer(function(req, res) {
    var index = "./index.html";
    var stats;

    req.url === "/" ?  fileName = index : fileName = "." + req.url;

    if(fileName == './reload'){
      res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
      event.once('reload', function(data) {
        res.write("data: " + data + "\n\n");
      });
    } else {
      try {
        stats = fs.lstatSync(fileName);
      } catch (e) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.write('404 Not Found\n');
        res.end();
        return;
      }

      if (stats.isFile()) {
        var mimeType = mimeTypes[path.extname(fileName).split(".")[1]];
        res.writeHead(200, {'Content-Type': mimeType} );
        var fileStream = fs.createReadStream(fileName);
        fileStream.pipe(res);
      }
    } 

  })
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
    {modules: modules, helpers: helpers, namespace: config.app.namespace, reload: true, vendors: vendors},
    true
  );
}

function concatCss() {
  savePath = rootify('assets/application.css');
  var out = config.css.map(function(cssFile){
    filePath = './stylesheets/'+cssFile+'.css'
    return fs.readFileSync(filePath, 'utf-8');
  });
  return fsp.createFile(savePath).then(function() {
    return fsp.writeFile(savePath, out.join('\n')).then(function() {
      message.fileCreated(savePath);
    }, fsp.error);
  }, fsp.error);
}

function locales() {
  savePath = rootify('config/locales.js');
  return fsp.readdir(rootify('config/locales')).then(function(locales) {
    concatString = fsp.concat(locales)
    jsonObject = 'Ember.I18n.translations = '+JSON.stringify(YAML.parse(concatString), null, 2);
    return fsp.createFile(savePath).then(function() {
      return fsp.writeFile(savePath, jsonObject).then(function() {
        message.fileCreated(savePath);
      }, fsp.error);
    }, fsp.error);
  });
}

function files(file){
  lists.push(file)
  console.log(lists);
};

function build() {
  var savePath = rootify('assets/application.js');
  var command = __dirname + '/../../node_modules/browserbuild/bin/browserbuild ' +
                "-m index -b " + root + "/ `find "+ root + " -name '*.js' -not -path './assets/*'` > " +
                savePath;
  exec(command, function (error, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
    if (error) throw new Error(error);
    message.fileCreated(savePath);
    event.emit('reload', true);
  });
}

function watch() {
  if(init){
    findit.find(root, function (file) {
      if(!file.match(/assets/g) && file != rootify('index.js') && file != rootify('templates.js') && file != rootify('config/locales.js')){
        fs.watchFile(file, { persistent: true, interval: 100 }, function (curr, prev) {
          if (curr.mtime > prev.mtime) {
            message.notify("-> Build: generate application.js");
            precompile(rootify('templates'), rootify('templates.js'), function() {
              locales().then(createIndex).then(concatCss).then(build)
            });
          }
        });
      }
    });
  }
}

function rootify(path) {
  return root + '/' + path;
}

function unroot(path) {
  return path.replace(root + '/', '');
}

