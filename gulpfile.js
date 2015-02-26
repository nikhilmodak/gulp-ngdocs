  

  var gulp        = require('gulp');
  var cssmin      = require('gulp-cssmin');
  var uglify      = require('gulp-uglify');
  var concat      = require('gulp-concat');
  var concatCSS   = require('gulp-concat-css');
  var copy        = require('gulp-copy');
  var del         = require('del');
  var rename      = require('gulp-rename');
  var jshint      = require('gulp-jshint');

  // Handlers
  var errorHandler = function (who) {
      if(who.on) who.on('error', function (e){ who.end(); });
  }

  var paths = {
    src: {
      css:    [
                  './bower_components/bootstrap/dist/css/bootstrap.css', 
                  './src/templates/css/*.css'
              ],
      js:     [
                  './bower_components/angular-bootstrap/ui-bootstrap.js', 
                  './bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                  './src/templates/js/*.js'
              ],
      others: ['./src/*.js', './src/*.words', './src/templates/*.tmpl']
    },
    dest: {
      dist: './dist',
      css:  './dist/templates/css',
      js:   './dist/templates/js',
    },
  };

  gulp.task('cleanMinStyles', function (){
    del(paths.dest.css+'/*.min.css');
  });

  gulp.task('concatStyles', function (){
    gulp.src(paths.src.css)
        .pipe(concatCSS('styles.css'))
        .pipe(gulp.dest(paths.dest.css));
  });

  gulp.task('minifyStyles', function (){
    gulp.src(paths.dest.css+'/styles.css')
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.dest.css));
  });

  gulp.task('lint', function (){
    return gulp.src(paths.src.js[2])
        .pipe(jshint())
        .pipe(jshint.reporter('default', { verbose: true }));
  })

  gulp.task('styles', ['cleanMinStyles', 'concatStyles', 'minifyStyles']);

  gulp.task('cleanMinScripts', function (){
    del(paths.dest.js+'/*.min.js');
  });

  gulp.task('concatScripts', function (){
    gulp.src(paths.src.js)
      .pipe(concat('scripts.js'))
      .pipe(gulp.dest(paths.dest.js));
  });

  gulp.task('minifyScripts', function (){
    gulp.src(paths.dest.js+'/scripts.js')
      .pipe(uglify())
      .pipe(rename('scripts.min.js'))
      .pipe(gulp.dest(paths.dest.js));
  });

  gulp.task('scripts', ['lint', 'cleanMinScripts', 'concatScripts', 'minifyScripts']);

  gulp.task('copyFiles', function (){
    gulp.src(paths.src.others)
      .pipe(copy(paths.dest.dist, {prefix:1}));
  });

  gulp.task('build', ['styles', 'scripts', 'copyFiles']);

  gulp.task('watch', function() {
    gulp.watch(paths.src.css, ['styles']);
    gulp.watch(paths.src.js, ['scripts']);
    gulp.watch(paths.src.others, ['copyFiles']);
  });

  gulp.task('default', ['build', 'watch']);

