var istanbul = require('browserify-istanbul');
var hbsfy = require('hbsfy');
module.exports = function(config) {
    config.set({
        basePath: './',

        frameworks: [
            'browserify',
            'jasmine'
        ],

        files: [
            'lib/json2/json2.js',
            'lib/jquery/jquery.js',
            'lib/tui-code-snippet/code-snippet.js',
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
            //'mocha',
            'dots',
            'coverage',
            'junit'
        ],

        browserify: {
            debug: true,
            bundleDelay: 1000,
            transform:[hbsfy, istanbul({
                ignore: [
                    'index.js'
                ]
            })]
        },

        coverageReporter: {
            dir: 'report/',
            reporters: [{
                type: 'cobertura',
                subdir: 'cobertura',
                file: 'cobertura.xml'
            }]
        },

        junitReporter: {
            outputDir: 'report/junit',
            suite: ''
        },


        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,

        autoWatch: false,

        browserStack: {
            username: process.env.BROWSER_STACK_USERNAME,
            accessKey: process.env.BROWSER_STACK_ACCESS_KEY,
            project: 'tui-component-uploader'
        },

        // define browsers
        customLaunchers: {
            bs_ie7: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: 'XP',
                browser_version: '7.0',
                browser: 'ie'
            },
            bs_ie8: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: 'XP',
                browser_version: '8.0',
                browser: 'ie'
            },
            bs_ie9: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '7',
                browser_version: '9.0',
                browser: 'ie'
            },
            bs_ie10: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '7',
                browser_version: '10.0',
                browser: 'ie'
            },
            bs_ie11: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '7',
                browser_version: '11.0',
                browser: 'ie'
            },
            bs_edge: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '10',
                browser: 'edge',
                browser_version: '12.0'
            },
            bs_chrome_mac: {
                base: 'BrowserStack',
                os: 'OS X',
                os_version: 'El Capitan',
                browser: 'chrome',
                browser_version: '47.0'
            },
            bs_firefox_mac: {
                base: 'BrowserStack',
                os: 'OS X',
                os_version: 'El Capitan',
                browser: 'firefox',
                browser_version: '43.0'
            }
        },

        browsers: [
            //'bs_ie7', Timeout no activity
            'bs_ie8',
            'bs_ie9',
            'bs_ie10',
            'bs_ie11',
            'bs_edge',
            'bs_chrome_mac',
            'bs_firefox_mac'
        ],

        singleRun: true
    });
};
