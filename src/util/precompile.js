var walk = require('walk').walk;
var fs = require('./fs');
var message = require('../util/message');
var precompile = require('../../packages/ember-template-compiler').precompile;

module.exports = function(source, savePath, callback) {
  callback = callback || function(){};
  getTemplates(source, function(templates) {
    compile(templates, function(src) {
      var locals = { templates: templates };
      fs.writeTemplate('precompile', 'templates.js', locals, savePath, 'force');
      callback();
    });
  });
};

function compile(templates, callback) {
  templates.forEach(function(template) {
    var fn = precompile(template.content);
    template.src = fn.toString();
  });
  callback(templates);
}

function getTemplates(source, callback) {
  var templates = [];
  var walker = walk(source);

  walker.on('file', function(dir, stats, next) {
    if (stats.name.charAt(0) !== '.') {
      var path = dir + '/' + stats.name;
      var name = path.replace(/(\.handlebars|\.hbs)$/, '').replace(source + '/', '');
      templates.push({
        name: name,
        content: fs.readFileSync(path).toString()
      });
    }
    next();
  });

  walker.on('end', function() {
    callback(templates);
  });
}
