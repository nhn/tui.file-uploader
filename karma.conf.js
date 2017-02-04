var istanbul = require('browserify-istanbul');

module.exports = function(config) {
    config.set({
        basePath: '',


        frameworks: [
            'browserify',
            'jasmine'
        ],

        files: [
            'bower_components/jquery/jquery.js',
            'bower_components/tui-code-snippet/code-snippet.js',
            'src/**/uploader.js',
            'src/**/*.js',
            'test/**/*.spec.js'
        ],

        exclude: [
        ],

        preprocessors: {
            'index.js': ['browserify'],
            'src/**/*.js': ['browserify'],
            'test/**/*.js': ['browserify']
        },

        reporters: [
            'dots',
            'coverage',
            'junit'
        ],

        browserify: {
            debug: true,
            bundleDelay: 1000,
            transform: [istanbul({
                ignore: [
                    'index.js'
                ]
            })]
        },

        coverageReporter: {
            type: 'html',
            dir: 'report/'
        },

        junitReporter: {
            outputDir: 'report/',
            suite: ''
        },

        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,

        autoWatch: true,

        browsers: [
            'PhantomJS'
        ],

        singleRun: false,

        browserNoActivityTimeout: 30000
    });
};
