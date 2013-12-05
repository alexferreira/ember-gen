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
var gaze = require('gaze');
var YAML = require('yamljs');
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var http = require("http");
var path = require("path");
var stylus = require('stylus');
var _ = require('underscore');
var config,root;

module.exports = function(program, test) {
  var env = arguments[arguments.length - 1];
  config = require('../util/config')();
  port = env.port;
  init = env.init;
  watch = env.watch;
  root = config.app.appDir;
  vendor = config.vendor;

  mimeTypes = {"html": "text/html", "jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "js": "text/javascript", "css": "text/css", "woff": "application/font-woff"};

  precompile(rootify('templates'), rootify('templates.js'), function() {
    locales().then(createVendor).then(createIndex).then(concatCss).then(buildVendor).then(build).then(start_server).then(watch_files);
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
    // console.log(fileName.match(/assets/))
    if(fileName == './reload'){
      res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
      event.once('reload', function(data) {
        res.write("data: " + data + "\n\n");
      });
    } else if(!fileName.match(/assets/)){
        var mimeType = mimeTypes[path.extname(index).split(".")[1]];
        res.writeHead(200, {'Content-Type': mimeType} );
        var fileStream = fs.createReadStream(index);
        fileStream.pipe(res);
        return;
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
    var name;
    walker.on('file', function(dir, stats, next) {
      if (stats.name.charAt(0) !== '.' && stats.name.match(/\.js$/)) {
        var path = unroot(dir + '/' + stats.name).replace(/\.js$/, '');
        if (dirName == 'assets') return;
        if (dirName == 'vendor') return;
        if (dirName == 'test') return;
        if (dirName == 'helpers') {
          helpers.push({path: path});
        } else {
          // console.log(path.match(/^models/))
          // if(dirName == 'models'){
          //   name = path.replace(dirName, '').substring(1).split('/')

          //   newName = [];
          //   name.forEach(function(str){
          //     newName.push(inflector.objectify(str));
          //   })
          //   name = newName.join('.');
          // } else {
            name = inflector.objectify(path.replace(dirName, ''));
          // }

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
    {modules: modules, helpers: helpers, namespace: config.app.namespace, reload: init},
    true
  );
}

function concatCss() {
  savePath = rootify('assets/application.css');

  var out = config.stylesheets.map(function(cssFile){
    filePath = './stylesheets/'+cssFile
    return fs.readFileSync(filePath, 'utf-8');
  }).join('\n');

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

      fsp.exists(savePath).then(function(exist){
        if(exist) return fs.unlinkSync(savePath)
      }).then(function(path){
        fsp.createFile(savePath).then(function() {
          return fsp.writeFile(savePath, css).then(function() {
            message.fileCreated(savePath);
          }, fsp.error);
        }, fsp.error);
      });
    });
}

function locales() {
  savePath = rootify('config/locales.js');
  return fsp.readdir(rootify('config/locales')).then(function(locales) {
    locales = locales.filter(function(item){ return item.match(/.yml$/); });
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

function buildVendor() {
  var savePath = rootify('assets/vendors.js');
  var command = __dirname + '/../../node_modules/browserbuild/bin/browserbuild ' +
                "-m index -b vendor/ `find vendor -name '*.js'` > " +
                savePath;
  exec(command, function (error, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
    if (error) throw new Error(error);
    message.fileCreated(savePath);
  });
}

function build() {
  var savePath = rootify('assets/application.js');
  var command = __dirname + '/../../node_modules/browserbuild/bin/browserbuild ' +
                "-m index -b " + root + "/ `find "+ root + " -name '*.js' -not -path './assets/*' -not -path './vendor/*'` > " +
                savePath;
  exec(command, function (error, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
    if (error) throw new Error(error);
    message.fileCreated(savePath);
    event.emit('reload', true);
  });
}

function watch_files() {
  if(watch){
    var jsPath   = process.cwd()
    gaze(['**', '!assets/*', '!index.js', '!vendor/index.js', '!templates.js', '!config/locales.js', '!stylesheets/*'], function(err, watcher) {
      watcher.on('all', function(event, filepath) {
          message.notify("-> Build: generate application.js");
          precompile(rootify('templates'), rootify('templates.js'), function() {
            locales().then(createIndex).then(build)
          });
      });

      watcher.on('error', function(err) {
        console.log(err);
      });
    });

    gaze(['stylesheets/**'], function(err, watcher) {
      watcher.on('all', function(event, filepath) {
          message.notify("-> Build: generate application.js");
          precompile(rootify('templates'), rootify('templates.js'), function() {
            concatCss()
          });
      });

      watcher.on('error', function(err) {
        console.log(err);
      });
    });

    gaze(['vendors/**'], function(err, watcher) {
      watcher.on('all', function(event, filepath) {
          message.notify("-> Build: generate application.js");
          precompile(rootify('templates'), rootify('templates.js'), function() {
            createVendor().then(buildVendor)
          });
      });

      watcher.on('error', function(err) {
        console.log(err);
      });
    });
  }
}

function rootify(path) {
  return root + '/' + path;
}

function unroot(path) {
  return path.replace(root + '/', '');
}

