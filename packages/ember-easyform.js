(function() {
Ember.EasyForm = Ember.Namespace.create({
  VERSION: '0.1.0'
});

})();



(function() {
Ember.Handlebars.registerHelper('errorField', function(property, options) {
  if (this.get('errors')) {
    options.hash.property = property;
    return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Error, options);
  }
});

})();



(function() {
Ember.Handlebars.registerBoundHelper('formFor', function(object, options) {
  return Ember.Handlebars.helpers.view.call(object, Ember.EasyForm.Form, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('input', function(property, options) {
  options.hash.inputOptions = Ember.copy(options.hash);
  options.hash.property = property;
  options.hash.isBlock = !!(options.fn);
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Input, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('inputField', function(property, options) {
  var context = this,
      propertyType = function(property) {
    try {
      return (context.get('content') || context).constructor.metaForProperty(property).type;
    } catch(e) {
      return null;
    }
  };

  options.hash.valueBinding = property;
  options.hash.viewName = 'inputField-'+options.data.view.elementId;

  if (options.hash.as === 'text') {
    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.TextArea, options);
  } else {
    if (!options.hash.as) {
      if (property.match(/password/)) {
        options.hash.type = 'password';
      } else if (property.match(/email/)) {
        options.hash.type = 'email';
      } else if (property.match(/url/)) {
        options.hash.type = 'url';
      } else if (property.match(/color/)) {
        options.hash.type = 'color';
      } else if (property.match(/^tel/)) {
        options.hash.type = 'tel';
      } else if (property.match(/search/)) {
        options.hash.type = 'search';
      } else {
        if (propertyType(property) === 'number' || typeof(context.get(property)) === 'number') {
          options.hash.type = 'number';
        } else if (propertyType(property) === 'date' || (!Ember.isNone(context.get(property)) && context.get(property).constructor === Date)) {
          options.hash.type = 'date';
        }
      }
    } else {
      options.hash.type = options.hash.as;
    }
    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.TextField, options);
  }
});

})();



(function() {
Ember.Handlebars.registerHelper('labelField', function(property, options) {
  options.hash.property = property;
  options.hash.viewName = 'labelField-'+options.data.view.elementId;
  options.hash.class = 'control-label';
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Label, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('submit', function(value, options) {
  if (typeof(value) === 'object') {
    options = value;
    value = undefined;
  }
  options.hash.context = this;
  options.hash.value = value || 'Submit';
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Submit, options);
});

})();



(function() {

})();



(function() {
Ember.EasyForm.Checkbox = Ember.Checkbox.extend();

})();



(function() {
Ember.EasyForm.Error = Ember.View.extend({
  tagName: 'span',
  classNames: ['error'],
  init: function() {
    var watchFunc;
    this._super();

    // TODO: un-fuglify this
    watchFunc = {};
    watchFunc[''+this.property+'Watch'] = function() {
      if (typeof(this.get('controller.errors.'+this.property)) === 'string') {
        return (this.get('controller.errors.'+this.property));
      } else {
        // return (this.get('controller.errors.'+this.property) || [])[0];
        return (this.get('controller.errors.'+this.property) || []);
      }
    }.property('controller.errors.'+this.property);
    this.reopen(watchFunc);
    // console.log(  this  );
    this.set('template', Ember.Handlebars.compile('{{view.'+this.property+'Watch}}'));
    // console.log(this.get('position'));
  },

  // contentChanged: function(){
  //   this.$().hide().fadeToggle();
  // }.observes('controller.errors.'+this.property),

  // didInsertElement: function() {
  //   this.set('position', this.$().prev().offset());
  //   // this.$().hide().fadeToggle();
  //   // Ember.flashController.set('view', this);
  // },
});

})();



(function() {
Ember.EasyForm.Form = Ember.View.extend({
  tagName: 'form',
  attributeBindings: ['novalidate'],
  novalidate: 'novalidate',
  submit: function(event) {
    var _this = this, promise;

    if (event) {
      event.preventDefault();
    }

    if (Ember.isNone(this.get('context.validate'))) {
      this.get('controller').send('submit');
    } else {
      if (!Ember.isNone(this.get('context').validate)) {
        promise = this.get('context').validate();
      } else {
        promise = this.get('context.content').validate();
      }
      promise.then(function() {
        if (_this.get('context.isValid') === true) {
          console.log('sssss');
          _this.get('controller').send('submit');
        }
      });
    }
  }
});

})();



(function() {
Ember.EasyForm.Input = Ember.View.extend({
  init: function() {
    this._super();
    if (!this.isBlock) {
      this.set('template', Ember.Handlebars.compile(this.fieldsForInput()));
    }
    if(this.get('context').get('errors') !== undefined) {
      this.reopen({
        error: function() {
          return this.get('context').get('errors').get(this.property) !== undefined;
        }.property('context.errors.'+this.property)
      });
    }
  },
  tagName: 'div',
  // classNames: ['input', 'string', 'control-group'],
  classNames: ['control-group'],
  classNameBindings: ['error:fieldWithErrors'],
  didInsertElement: function() {
    this.set('labelField-'+this.elementId+'.for', this.get('inputField-'+this.elementId+'.elementId'));
  },
  concatenatedProperties: ['inputOptions'],
  inputOptions: ['as', 'placeholder', 'class'],
  fieldsForInput: function() {
    return this.labelField()+'<div class="controls">'+this.inputField()+this.errorField()+'</div>';
  },
  labelField: function() {
    var options = this.label ? 'text="'+this.label+'"' : '';
    // console.log(options);
    return '{{labelField '+this.property+' '+options+'}}';
  },
  inputField: function() {
    var options = '', key, inputOptions = this.inputOptions;
    // console.log(inputOptions);
    for (var i = 0; i < inputOptions.length; i++) {
      key = inputOptions[i];
      if (this[key]) {
        if (typeof(this[key]) === 'boolean') {
          this[key] = key;
        }
        options = options.concat(''+key+'="'+this[inputOptions[i]]+'"');
      }
    }

    // console.log(options);

    options.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

    return '{{inputField '+this.property+' '+options+'}}';
  },
  errorField: function() {
    var options = '';
    return '{{errorField '+this.property+' '+options+'}}';
  },
  focusOut: function() {
    if (!Ember.isNone(this.get('context.validate'))) {
      if (!Ember.isNone(this.get('context').validate)) {
        this.get('context').validate(this.property);
      } else {
        this.get('context.content').validate(this.property);
      }
    }
  }
});

})();



(function() {
Ember.EasyForm.Label = Ember.View.extend({
  tagName: 'label',
  attributeBindings: ['for'],
  init: function() {
    this._super();
    this.set('template', this.renderText());
  },
  renderText: function() {
    return Ember.Handlebars.compile(this.text || this.property.underscore().split('_').join(' ').capitalize());
  }
});

})();



(function() {
Ember.EasyForm.Select = Ember.Select.extend();

})();



(function() {
Ember.EasyForm.Submit = Ember.View.extend({
  tagName: 'input',
  attributeBindings: ['type', 'value'],
  type: 'submit',
  init: function() {
    this._super();
    this.set('value', this.value);
  },
  onClick: function() {
    if (this.get('context').validate()) {
      this.get('controller').send('submit');
    }
  }
});

})();



(function() {
Ember.EasyForm.TextArea = Ember.TextArea.extend();

})();



(function() {
Ember.EasyForm.TextField = Ember.TextField.extend();

})();



(function() {

})();



(function() {
Ember.TEMPLATES['easyForm/input'] = Ember.Handlebars.compile('<label {{bindAttr for="labelFor"}}>{{labelText}}</label>');

})();



(function() {

})();



(function() {
Ember.EasyForm.objectNameFor = function(object) {
  var constructorArray = object.constructor.toString().split('.');
  return constructorArray[constructorArray.length - 1].underscore();
};

})();



(function() {

})();

