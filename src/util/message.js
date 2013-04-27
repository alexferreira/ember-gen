var color = require('cli-color');
var green = color.green;
var yellow = color.yellow;
var red = color.red;

exports.assert = function(message, test) {
  if (test) return;
  throw new Error(message);
};

exports.error = function(message, test) {
  if (test) return;
  console.log(red('ember: ') + message);
  process.exit();
};

exports.notify = function(message) {
  console.log(message);
};

exports.fileCreated = function(path) {
  console.log(green("   created:\t") + path);
};

exports.fileUpdated = function(path) {
  console.log(green("   update:\t") + path);
};

exports.fileExists = function(path) {
  console.log(yellow("   exists:\t") + path);
};

exports.removeFile = function(path) {
  console.log(yellow("   remove:\t") + path);
};
