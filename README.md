Ember Gen [![Build Status](https://travis-ci.org/alexferreira/ember-gen.png?branch=dev)](https://travis-ci.org/alexferreira/ember-gen)
-----------

## Features

- prescribed file organization for sanity
- scaffolding for a smaller learning curve
- precompilation template for better performance
- application of a single file to a better experience
- generators for faster application development
- commonjs (node) style modules for js community <3 and isolated testing
- easily build semantic forms in ember and simple validators
- livereload browser every file change
- embedded server for development

## Dependence

To install the ember-gen is required
```
NodeJs >= 0.8
npm
```

## Installation

```
npm install -g ember-gen
```

## Quickstart

```
ember new demo-app -t bootstrap
cd demo-app
ember generate -s contact title:string email:string age:number
ember build
open demo-app/index.html
# visit #/contacts
```

## Server in Development

The server has a livereload that will observe any changes in the project files and updates the browser automatically.

the command to start the server is:

```
ember server
```

to set port use:

```
ember server -p 4000
```


## Usage

```
  Usage: ember [command] [options]

  Command-Specific Help

    ember [command] --help

  Commands:

    new [options]      creates a new ember application [dir]
    build|b [options]        compiles templates and builds the app
    generate|g [options]     generates application files
    precompile|p [options]   precompile templates from src dir to target dir

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

| options | object name | file |
| --------|-------------|------|
| `--model, -m post` | `Post` | `models/post.js` |
| `--view, -v post` | `PostView` | `views/post_view` |
| `--controller, -c post/comments` | `PostCommentsController` | `controllers/post/comments.js` |
| `--template, -t post/comments` | n/a | `templates/post/comments.hbs` |
|`--helper, -h truncate`  |     | `helpers/truncate.js`|
| `--route, -r post_comment` | `PostCommentRoute` | `routes/post_comment.js` |
| `--mixin, -m postable` | `Postable` | `mixins/postable.js` |
| `-mvcrt posts` | `Post` <br>`PostsView` <br>`PostsController` <br>`PostsRoute` | `models/post.js` <br>`views/posts_view` <br>`controllers/posts_controller.js` <br>`routes/post_route.js` <br>`templates/posts.hbs`|
| `--scaffold, -s post` | `Post` <br>`PostsView` <br>`PostsController` <br>`PostsRoute` | `models/post.js` <br>`views/posts_view` <br>`controllers/posts_controller.js` <br>`routes/post_route.js` <br>`templates/posts.hbs`|


_Notes:_

- Models will always be singular.

## Build
For any change in the application files should run the following command to compiles templates and builds the app

```
ember build 
```

You can also use an observer to compile the templates and build the app every change made in the application files

```
ember build -w
```

## Version Information

**Current Version: 0.1.0**

Package versions:

- ember 1.0.0-RC.2
- ember-data rev 12
- ember-template-compiler 1.0.0-RC.2
- handlebars 1.0.0-rc.3
- jQuery 1.9.1
- Underscore 1.4.4

## License and Copyright

[MIT Style License](http://opensource.org/licenses/MIT)

Copyright &copy; 2013 [Alex Ferreira](http://www.alexferreira.eti.br)