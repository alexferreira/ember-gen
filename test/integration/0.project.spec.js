var exec = require("child_process").exec;
var fs = require("fs");
var rm = require("rimraf");
var helpers = require("../support/helpers");

describe("project", function() {

  afterEach(function(done) {
    rm("./test-app", function() {
      done();
    });
  });

  it("should add a bunch of files and directories", function(done) {
    exec("./bin/ember new test-app", function(err) {
      helpers.assertPathsExist([
        "test-app/.ember",
        "test-app/controllers",
        "test-app/models",
        "test-app/routes",
        "test-app/templates",
        "test-app/views",
        "test-app/vendor",
        "test-app/index.html",
        "test-app/app.js", 
        "test-app/store.js", 
        "test-app/routes.js",
        "test-app/functions.js",
        "test-app/templates/application.hbs",
        "test-app/templates/index.hbs",
        "test-app/vendor/ember-data.js",
        "test-app/vendor/ember.js",
        "test-app/vendor/handlebars.js",
        "test-app/vendor/jquery.js",
        "test-app/vendor/localstorage_adapter.js"
      ], done);
    });
  });
});

