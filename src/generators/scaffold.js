var template = require('../util/template');
var inflector = require('../util/inflector');
var rsvp = require('rsvp-that-works');
var fs = require('fs');
var fsp = require('../util/fs-promised');
var message = require('../util/message');
var config, root;
var inf = inflector;

module.exports = function(resource, env) {
  config = require('../util/config')();
  root = config.app.appDir;
  templateName = config.app.template;
  return rsvp.all(
    createModel(resource, env.fields),
    createControllers(resource),
    createRoutes(resource),
    createTemplates(resource, env.fields),
    addRoutes(resource)
  );
};

function createModel(resource, fields) {
  var modelName = inflector.underscore(inflector.singularize(resource));
  return template.generate('model', modelName, {
    fields: fields,
    objectName: inflector.objectify(modelName)
  }, true);
}

function createControllers(resource) {
  var modelRoute = inflector.underscore(inflector.singularize(resource));
  var underscored = inflector.underscore(resource);
  var saveDir = root + '/controllers/'+inflector.pluralize(underscored)+'/';
  var objectName = inflector.objectify(resource) + 'Controller';
  var editController = template.write(
    'scaffold/controllers/edit_resource_controller.js',
    saveDir + 'edit_controller.js',
    {
      objectName: 'Edit' + objectName,
      resourcesRoute: inflector.pluralize(underscored)+'.show',
      modelRoute: modelRoute
    },
    true
  );
  var newController = template.write(
    'scaffold/controllers/new_resource_controller.js',
    saveDir + 'new_controller.js',
    {
      editObjectName: 'Edit' + objectName,
      editObjectPath: './edit_controller',
      objectName: 'New' + objectName
    },
    true
  );
  var showController = template.write(
    'scaffold/controllers/resource_controller.js',
    saveDir + 'show_controller.js',
    {
      objectName: objectName,
      resourcesRoute: inflector.pluralize(modelRoute)
    },
    true
  );
  return rsvp.all(editController, newController, showController);
}

function createRoutes(resource) {
  var underscored = inflector.underscore(resource);
  var saveDir = root + '/routes/'+inflector.pluralize(underscored)+'/';
  var objectName = inflector.objectify(resource) + 'Route';
  var modelName = inflector.underscore(inflector.singularize(resource));
  var newRoute = template.write(
    'scaffold/routes/new_resource_route.js',
    saveDir + 'new_route.js',
    {
      modelName: inflector.objectify(modelName),
      modelPath: '../../models/' + inflector.underscore(modelName),
      objectName: 'New' + objectName,
      editRoute: inflector.pluralize(underscored)+'/edit',
      controller: inflector.pluralize(underscored)+'_new'
    },
    true
  );
  var resourcesRoute = template.write(
    'scaffold/routes/resources_route.js',
    saveDir + 'index_route.js',
    {
      modelName: inflector.objectify(modelName),
      modelPath: '../../models/' + inflector.underscore(modelName),
      objectName: objectName
    },
    true
  );
  return rsvp.all(newRoute, resourcesRoute);
}

function createTemplates(resource, fields) {
  fields.forEach(function(field) {
    field.title = inflector.humanize(field.name);
    field.id = inflector.underscore(field.name);
  });

  var modelName = inflector.underscore(inflector.singularize(resource));
  var saveDir = root + '/templates/'+inflector.pluralize(resource)+'/';
  var edit = template.write(
    'scaffold/templates_'+templateName+'/edit_resource.hbs',
    saveDir + 'edit.hbs',
    {
      title: inflector.humanize(resource),
      fields: fields
    },
    true
  );
  var title = inflector.humanize(resource);
  var resourceTemplate = template.write(
    'scaffold/templates_'+templateName+'/resource.hbs',
    saveDir + 'show.hbs',
    {
      title: title,
      fields: fields,
      editRoute: inflector.pluralize(modelName)+'.edit',
      resourcesRoute: inflector.pluralize(modelName)+'.index',
      resources: inflector.pluralize(title)
    },
    true
  );
  var resources = template.write(
    'scaffold/templates_'+templateName+'/resources.hbs',
    saveDir + 'index.hbs',
    {
      title: inflector.pluralize(inflector.humanize(resource)),
      modelTitle: inflector.humanize(modelName),
      newPath: inflector.pluralize(modelName)+'.new',
      showPath: inflector.pluralize(modelName)+'.show',
      resource: modelName,
      fields: fields
    },
    true
  );
  return rsvp.all(edit, resourceTemplate, resources);
}

function addRoutes(resource) {
  resource = inflector.underscore(resource);
  var routesPath = root + '/config/routes.js';
  var fragment = template.compile('scaffold/routes.js', {
    resource: resource,
    resources: inflector.pluralize(resource)
  });
  var src = fs.readFileSync(routesPath).toString();
  // TODO: this is ghetto, be more intelligent
  src = src.replace(/(App\.Router\.map\(function\(\) \{)/, '$1\n\n' + fragment);
  return fsp.writeFile(routesPath, src).then(function() {
    message.fileCreated(routesPath);
  }, fsp.error);
}

function parseFields(fieldsString) {
  return fieldsString.map(function(pair, index, arr) {
    var split = pair.split(':');
    var isLast = index == arr.length - 1;
    return {
      name: split[0],
      type: split[1],
      comma: isLast ? '' : ','
    };
  });
}

