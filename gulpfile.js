
/*eslint-disable*/
var path = require('path');
var gulp = require('gulp');
var connect = require('gulp-connect');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var Karma = require('karma').Server;
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var eslint = require('gulp-eslint');
var header = require('gulp-header');

var pkg = require('./package.json');

var NAME = pkg.name.replace('tui-component-', '');
var VERSION = pkg.version;

var banner = ['/**',
    ' * <%= pkg.name %>',
    ' * @author <%= pkg.author %>',
    ' * @version v<%= pkg.version %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

var BUNDLE_PATH = './dist';

gulp.task('eslint', function() {
    return gulp.src(['./src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', ['eslint'], function(done) {
    new Karma({
        configFile: path.join(__dirname, 'karma.conf.private.js'),
        singleRun: true,
        logLevel: 'error'
    }, done).start();
});

gulp.task('connect', function() {
    connect.server();
});

gulp.task('bundle', function() {
    var b = browserify({
        entries: 'index.js'
    });

    return b.bundle()
        .on('error', function(err) {
            console.log(err.message);
            this.emit('end');
        })
        .pipe(source(NAME + '.js'))
        .pipe(buffer())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest(BUNDLE_PATH))
        .pipe(uglify())
        .pipe(rename(NAME + '.min.js'))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest(BUNDLE_PATH));
});

gulp.task('default', ['eslint', 'test', 'bundle']);
