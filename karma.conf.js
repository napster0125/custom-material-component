/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const path = require('path');
const webpackConfig = require('./webpack.config')[0];

const USING_TRAVISCI = Boolean(process.env.TRAVIS);
const USING_SL = Boolean(process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY);

const HEADLESS_LAUNCHERS = {
  /** See https://github.com/travis-ci/travis-ci/issues/8836#issuecomment-348248951 */
  'ChromeHeadlessNoSandbox': {
    base: 'ChromeHeadless',
    flags: ['--no-sandbox'],
  },
  'FirefoxHeadless': {
    base: 'Firefox',
    flags: ['-headless'],
  },
};

const SAUCE_LAUNCHERS = {
  'sl-ie': {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    version: '11',
    platform: 'Windows 10',
  },
};

const customLaunchers = Object.assign({}, USING_SL ? SAUCE_LAUNCHERS : {}, HEADLESS_LAUNCHERS);
const browsers = USING_TRAVISCI ? Object.keys(customLaunchers) : ['Chrome'];
const istanbulInstrumenterLoader = {
  use: [{
    loader: 'istanbul-instrumenter-loader',
    options: {esModules: true},
  }],
  exclude: [
    /node_modules/,
    /adapter.[jt]s$/,
    /constants.[jt]s$/,
  ],
  include: path.resolve('./packages'),
};

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],
    files: [
      'test/unit/index.js',
    ],
    preprocessors: {
      'test/unit/index.js': ['webpack', 'sourcemap'],
    },
    reporters: ['dots', 'coverage-istanbul'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: browsers,
    browserDisconnectTimeout: 40000,
    browserNoActivityTimeout: 120000,
    captureTimeout: 240000,
    concurrency: USING_SL ? 4 : Infinity,
    customLaunchers: customLaunchers,

    coverageIstanbulReporter: {
      'dir': 'coverage',
      'reports': ['html', 'lcovonly', 'json'],
      'report-config': {
        lcovonly: {subdir: '.'},
        json: {subdir: '.', file: 'coverage.json'},
      },
      // 'emitWarning' causes the tests to fail if the thresholds are not met
      'emitWarning': false,
      'thresholds': {
        statements: 95,
        branches: 95,
        lines: 95,
        functions: 95,
      },
    },

    client: {
      mocha: {
        reporter: 'html',
        ui: 'qunit',

        // Number of milliseconds to wait for an individual `test(...)` function to complete.
        // The default is 2000.
        timeout: 10000,
      },
    },

    webpack: Object.assign({}, webpackConfig, {
      module: Object.assign({}, webpackConfig.module, {
        // Cover source files when not debugging tests. Otherwise, omit coverage instrumenting to get
        // uncluttered source maps.
        rules: webpackConfig.module.rules.concat(config.singleRun ? [Object.assign({
          enforce: 'post',
          test: /\.ts$/,
        }, istanbulInstrumenterLoader), Object.assign({
          test: /\.js$/,
        }, istanbulInstrumenterLoader)] : []),
      }),
    }),

    webpackMiddleware: {
      noInfo: true,
    },
  });

  if (USING_SL) {
    const sauceLabsConfig = {
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
    };

    if (USING_TRAVISCI) {
      // See https://github.com/karma-runner/karma-sauce-launcher/issues/73
      Object.assign(sauceLabsConfig, {
        testName: 'Material Components Web Unit Tests - CI',
        tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
        startConnect: false,
      });
    }

    config.set({
      sauceLabs: sauceLabsConfig,
      // Attempt to de-flake Sauce Labs tests on TravisCI.
      transports: ['polling'],
      browserDisconnectTolerance: 3,
    });
  }
};
