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
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var config,root;

var http = require("http"),
    path = require("path"),
    port = process.argv[2] || 8080;

module.exports = function(program) {
  config = require('../util/config')();
  port = process.argv[3] || 8080;
  root = config.appDir;
  mimeTypes = {"html": "text/html", "jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "js": "text/javascript", "css": "text/css"};
  
  precompile(rootify('templates'), rootify('templates.js'), function() {
    createIndex().then(build).then(server).then(watch);
  });
};

function server(){
  http.createServer(function(req, res) {
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

  }).listen(port, "127.0.0.1");
  console.log("Server running at http://127.0.0.1:"+port+"/");
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
    {modules: modules, helpers: helpers, namespace: config.namespace, reload: true},
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
    event.emit('reload', true);
    cleanup();
  });
}

function cleanup() {
  // fs.unlink(rootify('index.js'));
  // fs.unlink(rootify('templates.js'));
}

function watch() {
  findit.find(root, function (file) {
    if(file != rootify('index.js') && file != rootify('templates.js') && file != rootify('javascripts/application.js')){
      fs.watchFile(file, { persistent: true, interval: 100 }, function (curr, prev) {
        if (curr.mtime > prev.mtime) {
          message.notify("-> Build: generate application.js");
          precompile(rootify('templates'), rootify('templates.js'), function() {
            createIndex().then(build);
          });
        }
      });
    }
  });
}

function rootify(path) {
  return root + '/' + path;
}

function unroot(path) {
  return path.replace(root + '/', '');
}

