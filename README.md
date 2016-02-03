gulp-ngdocs
===========

Gulp plugin for building [AngularJS](http://docs.angularjs.org) like documentation. This is inspired from [grunt-ngdocs](https://www.npmjs.org/package/grunt-ngdocs).

##Setup

`npm install gulp-ngdocs --save-dev`

##Usage

Create a `ngdocs` gulp task

```js
gulp.task('ngdocs', [], function () {
  var gulpDocs = require('gulp-ngdocs');
  return gulp.src('path/to/src/*.js')
    .pipe(gulpDocs.process())
    .pipe(gulp.dest('./docs'));
});
```
Create a `ngdocs` gulp task with options

```js
gulp.task('ngdocs', [], function () {
  var gulpDocs = require('gulp-ngdocs');
  var options = {
    scripts: ['../app.min.js'],
    html5Mode: true,
    startPage: '/api',
    title: "My Awesome Docs",
    image: "path/to/my/image.png",
    imageLink: "http://my-domain.com",
    titleLink: "/api"
  }
  return gulp.src('path/to/src/*.js')
    .pipe(gulpDocs.process(options))
    .pipe(gulp.dest('./docs'));
});
```

To use a different AngularJS version pass `angular` and `angular-animate` files in scripts.

```js
gulp.task('ngdocs', [], function () {
  var gulpDocs = require('gulp-ngdocs');
  var options = {
    /* pass both .min.js and .min.js.map files for angular and angular-animate */
    scripts: [
      'bower_components/angular/angular.min.js',
      'bower_components/angular/angular.min.js.map',
      'bower_components/angular-animate/angular-animate.min.js',
      'bower_components/angular-animate/angular-animate.min.js.map'
    ]
  }

  /*
  If you choose to use the remote links pass in the .min.js links for angular and angular-animate

  var options = {
    scripts: [
      'http://ajax.googleapis.com/ajax/libs/angularjs/<version>/angular.min.js',
      'http://ajax.googleapis.com/ajax/libs/angularjs/<version>/angular-animate.min.js'
    ]
  }
  */
  return gulp.src('path/to/src/*.js')
    .pipe(gulpDocs.process(options))
    .pipe(gulp.dest('./docs'));
});
```

If you would like to divide your documentation into different sections, use `gulpDocs.sections` instead of `gulp.src`.

```js
gulp.task('ngdocs', [], function () {
  var gulpDocs = require('gulp-ngdocs');
  var options = {
    //options
  }
  return gulpDocs.sections({
    api: {
      glob:['src/**/*.js', '!src/**/*.spec.js'],
      api: true,
      title: 'API Documentation'
    },
    tutorial: {
      glob: ['content/tutorial/*.ngdoc'],
      title: 'Tutorial'
    }
  }).pipe(gulpDocs.process(options)).pipe(gulp.dest('./docs'));
});
```
#### Serving index.html file

Opening *index.html* file via **file://** protocol will cause a number of troubles.
The easier way to avoid it is to run local server.
As an options you can use [gulp-connect](https://www.npmjs.com/package/gulp-connect)
```
npm install gulp-connect
```

```
gulp.task('connect_ngdocs', function() {
var connect = require('gulp-connect');
  connect.server({
    root: 'docs',
    livereload: false,
    fallback: 'docs/index.html',
    port: 8083
  });
});
```

###Doc comment example

A doc comment looks like this:
```js
/**
 * @ngdoc directive
 * @name rfx.directive:rAutogrow
 * @element textarea
 * @function
 *
 * @description
 * Resize textarea automatically to the size of its text content.
 *
 * **Note:** ie<9 needs polyfill for window.getComputedStyle
 *
 * @example
   <example module="rfx">
     <file name="index.html">
         <textarea ng-model="text"rx-autogrow class="input-block-level"></textarea>
         <pre>{{text}}</pre>
     </file>
   </example>
 */
angular.module('rfx', []).directive('rAutogrow', function() {
  //some nice code
});
```

Check out the [Writing AngularJS documentation wiki article](https://github.com/angular/angular.js/wiki/Writing-AngularJS-Documentation) to see what's possible,
or take a look at the [AngularJS source code](https://github.com/angular/angular.js/tree/master/src/ng) for more examples.

##Options

####scripts
Set additional custom JS files are loaded to the app. This allows the live examples to use custom directives, services, etc. The documentation app works with AngularJS 1.2+ and 1.3+. If you include a different version of AngularJS, make sure to include angular-animate.js as well.

Possible values:

  - `['path/to/file.js']` file will be copied into the docs, into a `js` folder
  - `['http://example.com/file.js', 'https://example.com/file.js', '//example.com/file.js']` reference remote files (eg from a CDN)
  - `['../app.js']` reference file relative to the dest folder

####styles
[default] `[]`
Copy additional css files to the documentation app

####analytics
Optional include Google Analytics in the documentation app.

Example usage:

```js
var opts = {
  analytics: {
    account: 'UA-XXXXXX-YY',
    domainName: 'http://mywebpage.com/'
  }
};
```

####discussions
Optional include [discussions](http://disqus.com) in the documentation app.

####editExample
[default] `true`
Show Edit Button for examples.

####title
[default] `"API Documentation"`
Title to put on the navbar and the page's `title` attribute.

####startPage
[default] `'/api'`
Set first page to open.

####html5Mode
[default] `true`
Whether or not to enable `html5Mode` in the docs application.  If true, then links will be absolute.  If false, they will be prefixed by `#/`.

####image
A URL or relative path to an image file to use in the top navbar.

####titleLink
[default] no anchor tag is used
Wraps the title text in an anchor tag with the provided URL.

####imageLink
[default] no anchor tag is used
Wraps the navbar image in an anchor tag with the provided URL.

####bestMatch
[default] `false`
The best matching page for a search query is highlighted and get selected on return.
If this option is set to true the best match is shown below the search field in an dropdown menu. Use this for long lists where the highlight is often not visible.

####navTemplate
[default] `null`
Path to a template of a nav HTML template to include.  The css for it
should be that of listitems inside a bootstrap navbar:
```html
<header class="header">
  <div class="navbar">
    <ul class="nav">
      {{links to all the docs pages}}
    </ul>
    {{YOUR_NAV_TEMPLATE_GOES_HERE}}
  </div>
</header>
```
Example: 'templates/my-nav.html'

The template, if specified, is pre-processed using [_.template](http://lodash.com/docs#template).

####loadDefaults
Use this option to disable any of the four scripts `angular`, `angularAnimate`, `marked`, and `prettify` (google) which are loaded by default. This would give the user the ability to disable any scripts if they are using methods outside of regular angular/animate loading like browserify.

Example usage:
```js
var opts = {
  loadDefaults: {
    angularAnimate: false
  }
}
```

##Options for Sections

####glob

[required] glob pattern of files to parse for documentation comments.

###title

[default] name of the section. Set the title for the section in the documentation app.

###api

[default] `true` Set the name for the section in the documentation app.
