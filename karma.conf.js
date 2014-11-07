'use strict';
// ## Karma Configuration

// [Karma](http://karma-runner.github.io/) is used for running
// tests in this demo with the help of
// [karma-webpack](https://github.com/webpack/karma-webpack).

module.exports = function (config) {
  config.set({
    // * frameworks - 
    //   Test frameworks we are using.
    //   [mocha](http://mochajs.org/) and [chai](http://chaijs.com/).
    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    // * files - 
    //   Sets the entry point(s). Use a single entry point here
    //   unless you don't mind a webpack per file.
    files: [
      'test/entry.js'
    ],
    // * preprocessors - 
    //   Should match `files` and specify webpack as the preprocessor. If you
    //   wish to use [karma-sourcemap-loader](https://github.com/demerzel3/karma-sourcemap-loader)
    //   see [karma-webpack source-maps](https://github.com/webpack/karma-webpack#source-maps).
    preprocessors: {
      'test/entry.js': ['webpack']
    },
    // * webpack - 
    //   Uses the same webpack configuration as everything.
    //   karma-webpack overrides the output path and uses
    //   in-memory fs so it doesn't hit to disk for tests.
    webpack: require('./webpack.config.js'),
    webpackServer: {
      quiet: true,
      stats: true
    },
    // * port - 
    //   Sets the port the run on when running tests. If this
    //   is conflicting with something, set it in the `gulpfile.js`
    port: 8080,
    // * logLevel - 
    //   set to `config.LOG_WARN` for more debugging output
    logLevel: config.LOG_INFO,
    // * colors - 
    //   Who doesn't like colors?
    colors: true,
    // * autoWatch - 
    //   Tests are single run. Keep this off.
    autoWatch: false,
    // * browsers - 
    //   Start these browsers, currently available:
    //   - Chrome
    //   - ChromeCanary
    //   - Firefox
    //   - Opera
    //   - Safari (only Mac)
    //   - PhantomJS
    //   - IE (only Windows)
    browsers: ['PhantomJS'],
    // * reporters - 
    //   `reporters: ['progress']` option is handy for silent output and
    //   can be passed in in the gulpfile.js as any
    //   option can.
    reporters: ['mocha'],
    // * captureTimeout -
    //   Increase if your tests take more than 60 seconds.
    captureTimeout: 60000,
    // * singleRun - 
    //   We only want one run in our setup.
    singleRun: true,
    // * plugins - 
    //   List of plugins we are using for frameworks, preprecessors, and reporters.
    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-mocha-reporter'),
      require('karma-phantomjs-launcher'),
      require('karma-chai-plugins')
    ]
  });
};

