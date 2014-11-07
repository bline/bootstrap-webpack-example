// ## Setup
var _ = require('lodash');
var del = require("del");
var gulp = require("gulp");
var $ = require('gulp-load-plugins')();
var opn = require('opn');
var marked = require('marked');
var cheerio = require('cheerio');
// [Karma](http://karma-runner.github.io/) for running browser tests
// in [PhantomJS](http://phantomjs.org/).
var karma = require('karma').server;

// Load config for webpack target below.
// karma.conf.js uses the same configuration file.
var webpackConfig = require("./webpack.config.js");

// Custom template tags so cheerio doesn't reformat
// our template markup.
var TemplateOptions = {
  interpolate: /\[\[=([\s\S]+?)\]\]/g,
  escape:      /\[\[-([\s\S]+?)\]\]/g,
  evaluate:    /\[\[([\s\S]+?)\]\]/g
};

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
  html = '<?prettify';
  if (_.isNumber(startLine))
    html += ' linenums=' + startLine;
  html += '><pre class="prettyprint">' + _.escape(code) + '</pre>'
  return html;
};
// Setup marked to use our highlighter.
marked.setOptions({ highlight: highlight });

// ### doccoHtml

// Uses [cheerio](https://github.com/cheeriojs/cheerio) to do for html
// what we use docco for with other languages. Extracts out the comments
// and maintains the line numbers for
// [google-code-prettify](https://code.google.com/p/google-code-prettify/)
var doccoHtml = function (path, html, config) {
  var walk, $, docs = [], sections = [], marker = "<!-- __MARKER__ -->";
  isValidComment = function (node) {
    return node.type === 'comment' && !String(node.nodeValue).match(/\[if\s+[^\]]+\]/);
  };
  walk = function () {
    if (isValidComment(this)) {
      docs.push(this.nodeValue);
      $(this).replaceWith($(marker));
    } else {
      $(this).contents().each(walk);
    }
  };
  $ = cheerio.load(html);
  $.root().contents().each(walk);
  var nextDoc = '', startLine = 1;
  _.forEach($.html().split(marker), function (htmlPart) {
    // Edge Case - First thing in html is a comment, we loose a line if that happens.
    if (htmlPart === '' && nextDoc === '')
      startLine++;
    else
      startLine += nextDoc.split("\n").length - 1;
    sections.push({
      docsHtml: marked(nextDoc),
      codeHtml: highlight(htmlPart, startLine),
      codeText: htmlPart
    });
    startLine += htmlPart.split("\n").length - 1;
    nextDoc = docs.shift() || '';
  });
  return sections;
};

// ### docco

// [docco](http://jashkenas.github.io/docco/) To parse out code/docs
// and [marked](https://github.com/chjj/marked) to format the docs.
// marked is manually applied because we are using
// [google-code-prettify](https://code.google.com/p/google-code-prettify/)
// to highlight code.
var docco = function (path, code, config) {
  if (/\.html$/.test(path)) {
    return doccoHtml(path, code, config);
  }
  if (!config) config = {};
  _.defaults(config, { languages: {} });

  var d = require('docco');
  var sections = d.parse(path, code, config);
  var startLine = 1;
  _.forEach(sections, function (section) {
    if (section.docsText !== '') {
      startLine += section.docsText.split("\n").length - 1;
    }
    section.codeHtml = highlight(section.codeText, startLine);
    startLine += section.codeText.split("\n").length - 1;
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
        .pipe($.template({ docs: docs }, TemplateOptions))
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

