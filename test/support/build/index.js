// This file is auto-generated by `ember build`.
// You should not modify it.

window.addEventListener("load", function() {
  if (!!window.EventSource) {
    source = new EventSource("reload");
    source.addEventListener("message", function(event) {
      if(event.data == "true") location.reload();
    }, false);

    source.addEventListener("error", function(event) {
      if (event.target.readyState === EventSource.CLOSED) {
        console.log("Connection closed!");
      } else if (event.target.readyState === EventSource.CONNECTING) {
        console.log("Connection closed. Attempting to reconnect!");
      } else {
        console.log("Connection closed. Unknown error!");
      }
    }, false);

  } else {
    console.log("Sorry, your browser doesn't support server-sent events");
  }
}, false);
require('./vendor/jquery');
require('./vendor/handlebars');
require('./vendor/underscore');
require('./vendor/ember');
require('./vendor/ember-data');
require('./vendor/ember-validations');
require('./vendor/ember-easyform');
require('./vendor/i18n');
require('./templates');

require('./functions');

var App = window.App = require('./app');

App.Store = require('./config/store');

require('./config/routes');
require('./config/locales');
