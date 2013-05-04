(function(window) {

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement /*, fromIndex */) {
      "use strict";

      if (this === void 0 || this === null) {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;

      if (len === 0) {
        return -1;
      }

      var n = 0;
      if (arguments.length > 0) {
        n = Number(arguments[1]);
        if (n !== n) { // shortcut for verifying if it's NaN
          n = 0;
        } else if (n !== 0 && n !== (Infinity) && n !== -(Infinity)) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }

      if (n >= len) {
        return -1;
      }

      var k = n >= 0
            ? n
            : Math.max(len - Math.abs(n), 0);

      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }

      return -1;
    };
  }

  // Instantiate the object
  if ('undefined' === typeof I18n) {
    I18n = {};
    if ('undefined' !== typeof window) {
      window.I18n = Ember.I18n = I18n;
    }
  }

  // Set default locale to english
  I18n.defaultLocale = "en";

  // Set default handling of translation fallbacks to false
  I18n.fallbacks = false;

  // Set default separator
  I18n.defaultSeparator = ".";

  // Set current locale to null
  I18n.locale = null;

  // Set the placeholder format. Accepts `{{placeholder}}` and `%{placeholder}`.
  I18n.PLACEHOLDER = /(?:\{\{|%\{)(.*?)(?:\}\}?)/gm;

  I18n.fallbackRules = {
  };

  I18n.pluralizationRules = {
    en: function (n) {
      return n == 0 ? ["zero", "none", "other"] : n == 1 ? "one" : "other";
    }
  };

  I18n.getFallbacks = function(locale) {
    if (locale === I18n.defaultLocale) {
      return [];
    } else if (!I18n.fallbackRules[locale]) {
      var rules = []
        , components = locale.split("-");

      for (var l = 1; l < components.length; l++) {
        rules.push(components.slice(0, l).join("-"));
      }

      rules.push(I18n.defaultLocale);

      I18n.fallbackRules[locale] = rules;
    }

    return I18n.fallbackRules[locale];
  }

  I18n.isValidNode = function(obj, node, undefined) {
    return obj[node] !== null && obj[node] !== undefined;
  };

  I18n.lookup = function(scope, options) {
    var options = options || {}
      , lookupInitialScope = scope
      , translations = this.prepareOptions(I18n.translations)
      , locale = options.locale || I18n.currentLocale()
      , messages = translations[locale] || {}
      , options = this.prepareOptions(options)
      , currentScope
    ;

    if (typeof(scope) == "object") {
      scope = scope.join(this.defaultSeparator);
    }

    if (options.scope) {
      scope = options.scope.toString() + this.defaultSeparator + scope;
    }

    scope = scope.split(this.defaultSeparator);

    while (messages && scope.length > 0) {
      currentScope = scope.shift();
      messages = messages[currentScope];
    }

    if (!messages) {
      if (I18n.fallbacks) {
        var fallbacks = this.getFallbacks(locale);
        for (var fallback = 0; fallback < fallbacks.length; fallbacks++) {
          messages = I18n.lookup(lookupInitialScope, this.prepareOptions({locale: fallbacks[fallback]}, options));
          if (messages) {
            break;
          }
        }
      }

      if (!messages && this.isValidNode(options, "defaultValue")) {
          messages = options.defaultValue;
      }
    }

    return messages;
  };

  // Merge serveral hash options, checking if value is set before
  // overwriting any value. The precedence is from left to right.
  //
  //   I18n.prepareOptions({name: "John Doe"}, {name: "Mary Doe", role: "user"});
  //   #=> {name: "John Doe", role: "user"}
  //
  I18n.prepareOptions = function() {
    var options = {}
      , opts
      , count = arguments.length
    ;

    for (var i = 0; i < count; i++) {
      opts = arguments[i];

      if (!opts) {
        continue;
      }

      for (var key in opts) {
        if (!this.isValidNode(options, key)) {
          options[key] = opts[key];
        }
      }
    }

    return options;
  };

  I18n.interpolate = function(message, options) {
    options = this.prepareOptions(options);
    var matches = message.match(this.PLACEHOLDER)
      , placeholder
      , value
      , name
    ;

    if (!matches) {
      return message;
    }

    for (var i = 0; placeholder = matches[i]; i++) {
      name = placeholder.replace(this.PLACEHOLDER, "$1");

      value = options[name];

      if (!this.isValidNode(options, name)) {
        value = "[missing " + placeholder + " value]";
      }

      regex = new RegExp(placeholder.replace(/\{/gm, "\\{").replace(/\}/gm, "\\}"));
      message = message.replace(regex, value);
    }

    return message;
  };

  I18n.translate = function(scope, options) {
    options = this.prepareOptions(options);
    var translation = this.lookup(scope, options);

    try {
      if (typeof(translation) == "object") {
        if (typeof(options.count) == "number") {
          return this.pluralize(options.count, scope, options);
        } else {
          return translation;
        }
      } else {
        return this.interpolate(translation, options);
      }
    } catch(err) {
      return this.missingTranslation(scope);
    }
  };

  I18n.localize = function(scope, value) {
    switch (scope) {
      case "currency":
        return this.toCurrency(value);
      case "number":
        scope = this.lookup("number.format");
        return this.toNumber(value, scope);
      case "percentage":
        return this.toPercentage(value);
      default:
        if (scope.match(/^(date|time)/)) {
          return this.toTime(scope, value);
        } else {
          return value.toString();
        }
    }
  };

  I18n.pluralizer = function(locale) {
    pluralizer = this.pluralizationRules[locale];
    if (pluralizer !== undefined) return pluralizer;
    return this.pluralizationRules["en"];
  };

  I18n.findAndTranslateValidNode = function(keys, translation) {
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (this.isValidNode(translation, key)) return translation[key];
    }
    return null;
  };

  I18n.pluralize = function(count, scope, options) {
    var translation;

    try {
      translation = this.lookup(scope, options);
    } catch (error) {}

    if (!translation) {
      return this.missingTranslation(scope);
    }

    var message;
    options = this.prepareOptions(options);
    options.count = count.toString();

    pluralizer = this.pluralizer(this.currentLocale());
    key = pluralizer(Math.abs(count));
    keys = ((typeof key == "object") && (key instanceof Array)) ? key : [key];

    message = this.findAndTranslateValidNode(keys, translation);
    if (message == null) message = this.missingTranslation(scope, keys[0]);

    return this.interpolate(message, options);
  };

  I18n.missingTranslation = function() {
    var message = '[missing "' + this.currentLocale()
      , count = arguments.length
    ;

    for (var i = 0; i < count; i++) {
      message += "." + arguments[i];
    }

    message += '" translation]';

    return message;
  };

  I18n.currentLocale = function() {
    return (I18n.locale || I18n.defaultLocale);
  };

  // shortcuts
  I18n.t = I18n.translate;
  I18n.l = I18n.localize;
  I18n.p = I18n.pluralize;

  Ember.Handlebars.registerHelper('t', function(key, options) {
    var attrs, context, data, elementID, result, tagName, view, bindView;

    isBinding = /(.+)Binding$/;

    context = this;
    attrs = options.hash;
    data = options.data;
    view = data.view;
    tagName = attrs.tagName || 'span';
    delete attrs.tagName;
    elementID = "i18n-" + (Ember.uuid++);

    Em.keys(attrs).forEach(function(property) {
      var bindPath, currentValue, invoker, isBindingMatch, normalized, normalizedPath, observer, propertyName, root, _ref;
      isBindingMatch = property.match(isBinding);

      if (isBindingMatch) {
        propertyName = isBindingMatch[1];
        bindPath = attrs[property];
        currentValue = get(context, bindPath, options);
        attrs[propertyName] = currentValue;
        invoker = null;
        normalized = Ember.Handlebars.normalizePath(context, bindPath, data);
        _ref = [normalized.root, normalized.path], root = _ref[0], normalizedPath = _ref[1];

        observer = function() {
          var elem, newValue;
          if (view.get('state') !== 'inDOM') {
            Em.removeObserver(root, normalizedPath, invoker);
            return;
          }
          newValue = get(context, bindPath, options);
          elem = view.$("#" + elementID);
          attrs[propertyName] = newValue;
          return elem.html(I18n.t(key, attrs));
        };

        invoker = function() {
          return Em.run.once(observer);
        };

        return Em.addObserver(root, normalizedPath, invoker);
      }
    });
    
    result = '<%@ id="%@">%@</%@>'.fmt(tagName, elementID, I18n.t(key, attrs), tagName);
    return new Handlebars.SafeString(result);
  });

  Handlebars.registerHelper('translateAttr', function(options) {
    var attrs, result;
    attrs = options.hash;
    result = [];

    Em.keys(attrs).forEach(function(property) {
      var translatedValue;
      translatedValue = I18n.t(attrs[property]);
      return result.push('%@="%@"'.fmt(property, translatedValue));
    });

    return new Handlebars.SafeString(result.join(' '));
  });

}).call(undefined, this);