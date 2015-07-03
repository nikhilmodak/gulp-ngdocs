'use strict';

var dom = require('./src/dom');
var ngdoc = require('./src/ngdoc');
var reader = require('./src/reader');

var fs = require('fs');
var vfs = require('vinyl-fs');
var through2 = require('through2');
var extend = require('extend');
var _ = require('lodash');
var gutil = require('gulp-util');
var File = gutil.File;
var PluginError = gutil.PluginError;
var path = require('canonical-path');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var merge = require('merge-stream');

var setup = {sections: {}, pages: [], apis: {}};
var fakeDest = '_FAKE_DEST_';
var templates = path.resolve(__dirname, 'src/templates');
var nodeModules = path.resolve(__dirname, 'node_modules');

function copyTemplates() {
  return function () {
    return vfs.src(['**/*', '!**/*.tmpl'], {cwd: templates});
  };
}

function streamFile(src, dir, dest, name) {
  return function () {
    return vfs.src(src).pipe(through2.obj(function (file, enc, callback) {
      name = name === undefined ? path.normalize(file.path).split('/').pop() : name;
      this.push(new File({
        base: dest,
        cwd: dest,
        path: path.join(dest, dir, name),
        contents: file.contents
      }));
      callback(null);
    }));
  };
}

function sections(sects) {
  return merge(_.map(sects, function (data, key) {
    if (data instanceof String) {
      data = {glob: data};
    }
    if (!data.hasOwnProperty('glob')) {
      throw new PluginError('gulp-ngdocs', 'Invalid sections, please refer to the documentation.');
    }
    if (!data.hasOwnProperty('title')) {
      data.title = key;
    }
    if (!data.hasOwnProperty('api')) {
      data.api = true;
    }
    var glob = data.glob;
    var opts = data.globOpts;
    setup.sections[key] = data.title;
    setup.apis[key] = data.api;
    return vfs.src(glob, opts)
      .pipe(through2.obj(
        function (file, enc, cb) {
          file.section = key;
          this.push(file);
          cb(null);
        }
      ));
    }));
}

function processDoc(opts) {
  opts = opts || {};

  var options = extend({
    startPage: '/api',
    scripts: [],
    styles: [],
    title: 'API Documentation',
    html5Mode: true,
    editExample: true,
    navTemplate: false,
    navContent: '',
    navTemplateData: {}
  }, opts);
  
  setup.pages = [];
  //Extend loadDefaults
  options.loadDefaults = extend({
      angular: true,
      angularAnimate: true,
      marked: true
    }, opts.loadDefaults);
    
  if (options.scripts && !(options.scripts instanceof Array)) {
    options.scripts = [options.scripts];
  }
  if (options.styles && !(options.styles instanceof Array)) {
    options.styles = [options.styles];
  }
  var defaultSection = 'api';
  var defaultScripts = [];

  //Default root paths for scripts
  var scriptPaths = {
    angular : [
      'angular/angular.min.js',
      'angular/angular.min.js.map'
    ],
    angularAnimate: [
      'angular-animate/angular-animate.min.js',
      'angular-animate/angular-animate.min.js.map'
    ],
    marked: [
      'marked/lib/marked.js'
    ]
  };
  
  //Sets default script paths
  function joinNodeModules(jsPaths){
    _.each(jsPaths, function(jsPath){
      defaultScripts.push(path.join(nodeModules, jsPath));
    });
  }
  //Iterate and checks to join paths
  _.each(scriptPaths, function(paths, key){
    if(options.loadDefaults[key])
      joinNodeModules(paths);
  });

  function writeSetup() {
    var options = setup.__options,
        content, data = {
          scripts: options.scripts,
          styles: options.styles,
          sections: _.keys(setup.sections).join('|'),
          discussions: options.discussions,
          analytics: options.analytics,
          navContent: options.navContent,
          title: options.title,
          image: options.image,
          titleLink: options.titleLink,
          imageLink: options.imageLink,
          bestMatch: options.bestMatch,
          deferLoad: !!options.deferLoad
        };

    // create index.html
    content = fs.readFileSync(path.resolve(templates, 'index.tmpl'), 'utf8');
    content = _.template(content, data);
    docsStream.push(new File({
      base: fakeDest,
      cwd: fakeDest,
      path: path.join(fakeDest, 'index.html'),
      contents: new Buffer(content, 'utf8')
    }));
    // create setup file
    setup.html5Mode = options.html5Mode;
    setup.editExample = options.editExample;
    setup.startPage = options.startPage;
    setup.discussions = options.discussions;
    setup.scripts = options.scripts;
    docsStream.push(new File({
      base: fakeDest,
      cwd: fakeDest,
      path: setup.__file,
      contents: new Buffer('NG_DOCS=' + JSON.stringify(setup, null, 2) + ';', 'utf8')
    }));
  }

  function transformFunction (file, enc, callback) {
    if (file.isNull()) {
      callback(null);
      return; // ignore
    }
    if (file.isStream()) {
      callback(new gutil.PluginError('gulp-ngdocs', 'Streaming not supported'));
      return;
    }
    if (file.contents) {
      if (!merged) {
        merged = merge(fstreams.map(function (f) {
          var s = f();
          s.on('data', function (file) {
            docsStream.push(file);
          });
          return s;
        }));

        merged.on('end', function () {
          mergedEnded = true;
          if (docsStreamEndCb) {
            docsStreamEndCb(null);
          }
        });
      }
      var content = decoder.write(file.contents);
      if (!file.section) {
        file.section = defaultSection;
      }
      reader.process(content, file.path, file.section, options);
    }
    callback(null);
  }

  function flushFunction (cb) {
    if (merged) {
      docsStreamEndCb = cb;
      // IMPORTANT: If you do not want an error here to destroy a gulp watch,
      // see: http://stackoverflow.com/questions/23971388/prevent-errors-from-breaking-crashing-gulp-watch
      try{
        ngdoc.merge(reader.docs);
        reader.docs.forEach(function(doc){
          // this hack is here because on OSX angular.module and angular.Module map to the same file.
          var id = doc.id.replace('angular.Module', 'angular.IModule').replace(':', '.'),
              file = path.join(fakeDest, 'partials', doc.section, id + '.html'),
              dir = path.join(fakeDest, 'partials', doc.section);
          docsStream.push(new File({
            base: fakeDest,
            cwd: fakeDest,
            path: file,
            contents: new Buffer(doc.html(), 'utf8')
          }));
        });

        ngdoc.checkBrokenLinks(reader.docs, setup.apis, options);

        setup.pages = _.union(setup.pages, ngdoc.metadata(reader.docs));
      } catch (flushError) {
        console.log(flushError);
        cb(flushError);
      }
      writeSetup(this);

      if (mergedEnded) {
        docsStreamEndCb(null);
        docsStreamEndCb = false;
      }
    } else {
      cb(null);
    }
  }

  var fstreams = [];
  var docsStream = through2.obj(transformFunction, flushFunction);
  var merged = false;
  var mergedEnded = false;
  var docsStreamEndCb = false;
  if (options.navTemplate) {
    options.navContent = _.template(
      fs.readFileSync(options.navTemplate, 'utf8'), 
      options.navTemplateData);
  }

  if (options.image) {
    if (!/^((https?:)?\/\/|\.\.\/)/.test(options.image)) {
      fstreams.push(streamFile(options.image, 'img', fakeDest));
      options.image = 'img/' + path.basename(options.image);
    }
  }

  var scriptNames = [];
  options.scripts = _.map(options.scripts, function (file) {
    var fileName = path.normalize(file);
    scriptNames.push(fileName);
    if (/^((https?:)?\/\/)/.test(file)) {
      return file;
    } else {
      fstreams.push(streamFile(file, path.join('js', path.dirname(fileName)), fakeDest));
      return path.join('js', fileName);
    }
  });

  _.forEach(defaultScripts, function (script, i) {
    var fileName = path.normalize(script).split('/').pop();
    if (scriptNames.indexOf(fileName) === -1) {    
      fstreams.push(streamFile(script, 'js', fakeDest));
      options.scripts.splice(i, 0, path.join('js', fileName));
    }
  });

  //Filter the maps
  options.scripts = _.filter(options.scripts, function (file) {
    return !(/^.*\.map$/.test(file));
  });

  options.styles = _.map(options.styles, function(file) {
      var fileName = path.normalize(file);
    if (/^((https?:)?\/\/)/.test(file)) {
      return file;
    } else {
      fstreams.push(streamFile(file, path.join('css', path.dirname(fileName)), fakeDest));
      return path.join('css', fileName);
    }
  });

  fstreams.push(copyTemplates(templates));
  setup.__file = path.join(fakeDest, 'js/docs-setup.js');
  setup.__options = options;

  reader.docs = [];
  if (Object.keys(setup.sections).length === 0) {
    setup.sections[defaultSection] = options.title;
    setup.apis[defaultSection] = true;
  }

  return docsStream;
}

module.exports = {
  process: processDoc,
  sections: sections
};
