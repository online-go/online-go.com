'use strict';

const spawn        = require('child_process').spawn;
const fs           = require('fs');
const gulp         = require('gulp');
const execSync     = require('child_process').execSync;
const livereload   = require('gulp-livereload');
const stylus       = require('gulp-stylus');
const sourcemaps   = require('gulp-sourcemaps');
const rename       = require('gulp-rename');
const pump         = require('pump');
const autoprefixer = require('autoprefixer');
const postcss      = require('gulp-postcss');
const cssnano      = require('cssnano');
const inline_svg   = require('postcss-inline-svg');
const gulpEslint   = require('gulp-eslint7');
const html_minifier= require('html-minifier').minify;

let ts_sources = [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
];
let SERVER = "beta.online-go.com";
//SERVER = "online-go.com";


gulp.task('watch_dist_js', watch_dist_js);
gulp.task('watch_html', watch_html);
gulp.task('watch_styl', watch_styl);
gulp.task('build_styl', build_styl);
gulp.task('min_styl', min_styl);
gulp.task('livereload-server', livereload_server);
gulp.task('background_webpack', background_webpack);
gulp.task('watch_eslint', watch_eslint);
gulp.task('dev-server', dev_server);
gulp.task('eslint', eslint);
gulp.task('minify-index', minify_index);
gulp.task('default',
    gulp.parallel(
        'dev-server',
        "livereload-server",
        "background_webpack",
        "build_styl",
        "watch_styl",
        "watch_dist_js",
        "watch_html",
        "watch_eslint"
    )
);


function reload(done) {
    livereload.reload();
    done();
}
function watch_dist_js(done) {
    gulp.watch(['dist/*.js'], reload);
    done();
}
function watch_html(done) {
    gulp.watch(['src/*.html'], reload);
    done();
}
function watch_styl(done) {
    gulp.watch(['src/**/*.styl', 'src/*.styl'], build_styl);
    done();
}
function livereload_server(done) {
    livereload.listen(35701);
    done();
}
function watch_eslint(done) {
    gulp.watch(ts_sources, eslint);
    done();
}

function eslint() {
    return gulp.src(ts_sources)
        .pipe(gulpEslint())
        .pipe(gulpEslint.format())
        .pipe(gulpEslint.failAfterError());
}

function build_styl(done) {
    pump([gulp.src('./src/ogs.styl'),
          sourcemaps.init(),
          stylus({
              compress: false,
              'include css': true,
          }),
          postcss([
              autoprefixer({
                  cascade: false
              }),
              inline_svg(),
              //cssnano(),
          ]),
          sourcemaps.write('.'),
          gulp.dest('./dist'),
    ],
      (err) => {
          if (err) {
              console.error(err);
          } else {
              livereload.reload('ogs.css');
          }
          done();
      }
    );
}

function min_styl(done) {
    let version = execSync('git describe --long || echo "min"');
    version = ("" + version).replace(/\s/g, '')
    console.log(version);
    console.info(`Building ogs.${version}.css`);
    pump([gulp.src('./src/ogs.styl'),
          sourcemaps.init(),
          stylus({
              compress: false,
              'include css': true,
          }),
          postcss([
              autoprefixer({
                  cascade: false
              }),
              inline_svg(),
              cssnano(),
          ]),
          rename({suffix: '.' + version}),
          sourcemaps.write('.'),
          gulp.dest('./dist'),
    ],
      (err) => {
          if (err) {
              console.error(err);
          } else {
              livereload.reload('ogs.css');
          }
          done();
      }
    );
}


function background_webpack(done) {
    function spawn_webpack() {
        let env = process.env;
        let webpack = spawn('npm', ['run', 'webpack-watch'], { stdio: 'inherit', shell: true })

        webpack.on('exit', spawn_webpack);
    }
    spawn_webpack();

    done()
}

function dev_server(done) {
    let port = 8080;
    let express = require('express');
    let body_parser = require('body-parser');
    let http = require('http');
    var proxy = require('express-http-proxy');
    let devserver = express();
    devserver.use(body_parser.json())
    devserver.use(body_parser.text())

    http.createServer(devserver)
        .listen(port, null, function() {
            console.info(`#############################################`);
            console.info(`## Development server started on port ${port} ##`);
            console.info(`##   http://dev.beta.online-go.com:${port}    ##`);
            console.info(`#############################################`);
        });

    devserver.use(express.static('dist'))
    devserver.use(express.static('assets'))

    let beta_proxy = (prefix) => proxy(SERVER, {
        https: true,
        proxyReqPathResolver: function(req) {
            let path = prefix + require('url').parse(req.url).path;
            console.log('-->', path);
            return path;
        }
    });

    devserver.use('/api', beta_proxy('/api'));
    devserver.use('/termination-api', beta_proxy('/termination-api'));
    devserver.use('/merchant', beta_proxy('/merchant'));
    devserver.use('/sso', beta_proxy('/sso'));
    devserver.use('/oauth2', beta_proxy('/oauth2'));
    devserver.use('/complete', beta_proxy('/complete'));
    devserver.use('/disconnect', beta_proxy('/disconnect'));
    devserver.use('/OGSScoreEstimator', beta_proxy('/OGSScoreEstimator'));
    devserver.use('/godojo', beta_proxy('/godojo'));

    devserver.get('/locale/*', (req, res) => {
        let options = {
            hostname: 'storage.googleapis.com',
            port: 80,
            path: '/ogs-site-files/dev' + req.path,
            method: 'GET',
        };

        let req2 = http.request(options, (res2) => {
            res2.setEncoding('utf8');
            let data = "";
            res2.on('data', (chunk) => {
                data += chunk.toString();
            });
            res2.on('end', () => {
                res.setHeader('content-type', 'application/javascript');
                res.setHeader("Content-Length", data.length);
                res.status(200).send(data);
            });
        });

        req2.on('error', (e) => {
            res.status(500).send(e.message);
        });

        req2.end();
    });

    devserver.get('/goban.js', (req, res) => {
        console.info(`GET ${req.path} -> node_modules/goban/lib/goban.js`);
        let js = fs.readFileSync('node_modules/goban/lib/goban.js', {encoding: 'utf-8'});
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader("Content-Length", js.length);
        res.status(200).send(js);
    });

    devserver.get('/goban.js.map', (req, res) => {
        console.info(`GET ${req.path} -> node_modules/goban/lib/goban.js.map`);
        let js = fs.readFileSync('node_modules/goban/lib/goban.js.map', {encoding: 'utf-8'});
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader("Content-Length", js.length);
        res.status(200).send(js);
    });

    devserver.get('/index.js.map', (req, res) => {
        let js = fs.readFileSync('node_modules/goban/lib/index.js.map', {encoding: 'utf-8'});
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader("Content-Length", js.length);
        res.status(200).send(js);
    });

    devserver.get('*', (req, res) => {
        console.info(`GET ${req.path}`);

        let _index = fs.readFileSync('src/index.html', {encoding: 'utf-8'});
        let supported_languages = JSON.parse(fs.readFileSync('i18n/languages.json', {encoding: 'utf-8'}));
        let _package_json = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf-8'}));

        let index = _index.replace(/[{][{]\s*(\w+)\s*[}][}]/g, (_,parameter) => {
            switch (parameter) {
                case 'CDN_SERVICE': return `//${req.hostname}:${port}/`;
                case 'LIVE_RELOAD': return `<script async src="//${req.hostname}:35701/livereload.js"></script>`;
                case 'MIN': return '';

                case 'PAGE_TITLE': return 'Play Go at online-go.com!';
                case 'PAGE_DESCRIPTION': return 'Online-Go.com is the best place to play the game of Go online. Our community supported site is friendly, easy to use, and free, so come join us and play some Go!';
                case 'PAGE_KEYWORDS': return 'Go, Baduk, Weiqi, OGS, Online-Go.com';
                case 'PAGE_LANGUAGE': return getPreferredLanguage(req, supported_languages);

                case 'OG_TITLE': return '';
                case 'OG_URL': return '';
                case 'OG_IMAGE': return '';
                case 'OG_DESCRIPTION': return '';
                case 'SUPPORTED_LANGUAGES': return JSON.stringify(supported_languages);

                case 'AMEX_CLIENT_ID': return "kvEB9qXE6jpNUv3fPkdbWcPaZ7nQAXyg";
                case 'AMEX_ENV': return "qa";

                case 'RELEASE': return '';
                case 'VERSION': return '';
                case 'LANGUAGE_VERSION': return '';
                case 'VENDOR_HASH_DOTJS': return 'js';
                case 'VERSION_DOTJS': return 'js';
                case 'OGS_VERSION_HASH_DOTJS': return 'js';
                case 'VERSION_DOTCSS': return 'css';
                case 'LANGUAGE_VERSION_DOTJS': return 'js';
                case 'GOBAN_JS': {
                    if (fs.lstatSync('node_modules/goban').isSymbolicLink()) {
                        return `/goban.js`;
                    } else {
                        return `https://cdn.online-go.com/goban/${_package_json.devDependencies.goban.substr(1)}/goban.js`;
                    }
                }
                case 'EXTRA_CONFIG':
                    return `<script>window['websocket_host'] = "https://${SERVER}";</script>`
                ;
            }
            return '{{' + parameter + '}}';
        });

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader("Content-Length", index.length);
        res.status(200).send(index);
    });

    done();
}


function minify_index(done) {
    let _index = fs.readFileSync('src/index.html', {encoding: 'utf-8'});

    let index = _index.replace(/[{][{]\s*(\w+)\s*[}][}]/g, (_,parameter) => {
        switch (parameter) {
            case 'VENDOR_HASH_DOTJS': return process.env['VENDOR_HASH'] + '.js';
            case 'OGS_VERSION_HASH_DOTJS': return process.env['OGS_VERSION_HASH'] + '.js';
        }
        return '{{' + parameter + '}}';
    });

    let res = html_minifier(index, {
        minifyJS: true,
        minifyCSS: true,
        collapseWhitespace:true,
        collapseInlineTagWhitespace:true,
        removeComments: true,
    });

    console.log(res);
    done();
}

/* Detect preferred language  */
function isSupportedLanguage(lang, supported_languages) {
    if (!lang) {
        return null;
    }

    lang = lang.toLowerCase();

    if (lang in supported_languages) {
        return lang;
    }

    lang = lang.replace(/-[a-z]+/, '');

    if (lang in supported_languages) {
        return lang;
    }

    return null;
}

function getPreferredLanguage(req, supported_languages) {
    let languages = ['en'];
    try {
        languages = req.headers['accept-language'].split(',').map(s => s.replace(/;q=.*/, '').trim().toLowerCase());
    } catch (e) {
        trace.error(e);
    }

    try {
        for (let i = 0; i < languages.length; ++i) {
            let lang = isSupportedLanguage(languages[i], supported_languages);
            if (lang) {
                return lang;
            }
        }
    } catch (e) {
    }

    return 'en';
}
