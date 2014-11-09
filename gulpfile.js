/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function () {
  'use strict';
  // ## Setup
  var _ = require('lodash');
  var del = require("del");
  var gulp = require("gulp");
  var $ = require('gulp-load-plugins')();
  var opn = require('opn');
  var marked = require('marked');
  var part = require('code-part');
  // [Karma](http://karma-runner.github.io/) for running browser tests
  // in [PhantomJS](http://phantomjs.org/).
  var karma = require('karma').server;

  // Load config for webpack target below.
  // karma.conf.js uses the same configuration file.
  var webpackConfig = require("./webpack.config.js");

  // [Karma](http://karma-runner.github.io/) needs a full path to the config file.
  var KarmaConfig = require('path').join(__dirname, './karma.conf.js');

  // Sources for generating `index.html`.
  var IndexSources = [
    'index.js',
    'index.html',
    'webpack.config.js',
    'gulpfile.js',
    'karma.conf.js',
    'style.less',
    'bootstrap.config.less',
    'bootstrap.config.js'
  ];

  // ## Helper Functions

  // ### highlight

  // Returns code with [google-code-prettify](https://code.google.com/p/google-code-prettify/)
  // markup setup to use line numbers started at specified line. Used in both docco and
  // doccoHtml to add prettify markup to the code sections of the docs.
  var highlight = function (code, startLine) {
    var html = '<?prettify';
    if (_.isNumber(startLine))
      html += ' linenums=' + startLine;
    html += '><pre class="prettyprint">' + _.escape(code) + '</pre>'
    return html;
  };
  // Setup marked to use our highlighter.
  marked.setOptions({ highlight: highlight });

  // ### docco

  // [code-part](http://github.com/bline/code-part) To parse out code/docs
  // and [marked](https://github.com/chjj/marked) to format the docs.
  // marked is manually applied because we are using
  // [google-code-prettify](https://code.google.com/p/google-code-prettify/)
  // to highlight code.
  var docco = function (path, code, config) {
    var sections = part(path, code, config);
    _.forEach(sections, function (section) {
      section.codeHtml = highlight(section.codeText, section.codeLine);
      section.docsHtml = marked(section.docsText);
    });
    return sections;
  }

  // ## Tasks

  // ### task clean
  // Cleans up dist directory using [del](https://github.com/sindresorhus/del).
  gulp.task("clean", function (done) {
    del(["dist/*"], done);
  });

  // ### task index
  // Build's the index file with documentation from [docco](http://jashkenas.github.io/docco/)
  // with the `index.html` [lodash template](https://lodash.com/docs#template).
  gulp.task("index", ["clean"], function (done) {
    var docs = [];
    gulp.src(IndexSources)
      .pipe($.tap(function (file) {
        docs.push({
          file: file,
          docco: docco(file.path, file.contents.toString()),
          id: _.uniqueId('file-')
        })}))
      // After we've created the `docs` array, build the template.
      .on('end', function () {
        gulp.src('index.html')
          .pipe($.template({ docs: docs }))
          .pipe(gulp.dest('dist'))
          .on('end', function () { done() })
      });
  });

  // ### task webpack
  // Builds the main.js and any resources (bootstrap uses a few)
  // into the dist directory. Uses [gulp-webpack](https://github.com/shama/gulp-webpack).
  gulp.task("webpack", ["clean"], function () {
    return gulp.src("index.js")
      .pipe($.webpack(webpackConfig))
      .pipe(gulp.dest('dist'));
  });

  // ### task build
  // Build `index.html` and `main.js`.
  gulp.task("build", ["webpack", "index"]);

  // ### task watch
  // Build and serve `index.html` on localhost port 3000
  // launching a browser with [opn](https://github.com/sindresorhus/opn) to view.
  // If you have the [livereload](https://github.com/vohof/gulp-livereload)
  // plugin for chrome installed it will also reload
  // your browser when files in the dist directory change.
  gulp.task("watch", ["build"], function () {
    $.livereload.listen();
    gulp.watch('dist/**/*').on('change', $.livereload.changed);
    gulp.watch(IndexSources, ['build']);
    opn("http://127.0.0.1:3000/");
    return $.serve('dist')();
  });

  // ### task deploy
  // Deploy to Github pages. *UNTESTED*
  gulp.task("deploy", ['build'], function () {
    return gulp.src("dist/**/*")
      .pipe($.ghPages('git@github.com:bline/bootstrap-webpack-example.git'));
  });

  // ### task test
  // Run tests in [Karma](http://karma-runner.github.io/) using [FantomJS](http://phantomjs.org/).
  gulp.task("test", function (done) {
    karma.start({
      configFile: KarmaConfig,
      singleRun: true
    }, done);
  });

  // ### task default
  // Run test by default.
  gulp.task("default", ["test"]);
})();
