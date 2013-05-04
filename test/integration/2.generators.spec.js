var exec = require("child_process").exec;
var fs = require("fs");
var rm = require("rimraf");
var helpers = require("../support/helpers");

function createTestApp(done) {
  exec("./bin/ember new test-app -t bootstrap", function(err) {
    fs.exists('test-app/config/app.yml', function(exists) {
      console.log(exists)
      exists.should.equal(true);
      done();
    });
  });  
}
function removeTestApp(done) {
  rm("./test-app", function() {
    done();
  });
}

function call(opts, done) {
  exec("cd test-app; ../bin/ember generate " + opts, function(err) {
    if (err) throw new Error(err);
    done();
  });
}

describe("model", function() {

  beforeEach(createTestApp);

  afterEach(removeTestApp);

  it("should generate models", function(done) {
    call("-m list", function() {
      helpers.assertPathsExist(['test-app/models/list.js'], done);
    });
  });

  it('should use singular name of resource name provided');
});

describe("view", function() {
  it("should use full resource name but save to sub directory");
});

describe("controller", function() {
  it("should use full resource name but save to sub directory");
});

describe("route", function() {
  it("should use full resource name but save to sub directory");
});

describe("template", function() {
  it("should save to sub directory");
});

describe("helper", function() {

  beforeEach(createTestApp);

  afterEach(removeTestApp);

  it("should generate a helper named 'truncate' in folder 'helpers'", function(done) {
    call("-h truncate", function() {
      helpers.assertPathsExist(["test-app/helpers/truncate.js"], done);
    });
  });
});

describe("mixin", function() {
  
  beforeEach(createTestApp);

  afterEach(removeTestApp);

  it("should generate a file named 'tacoable' in folder 'mixins'", function(done) {
    call("-x tacoable", function() {
      helpers.assertPathsExist(["test-app/mixins/tacoable.js"], done);
    });
  });
});

