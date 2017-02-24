const spawn        = require('child_process').spawn;
const fs           = require('fs');
const gulp         = require('gulp');
const execSync     = require('child_process').execSync;
const livereload   = require('gulp-livereload');
const stylus       = require('gulp-stylus');
const gutil        = require("gulp-util");
const sourcemaps   = require('gulp-sourcemaps');
const rename       = require('gulp-rename');
const pump         = require('pump');
const autoprefixer = require('autoprefixer');
const postcss      = require('gulp-postcss');
const cssnano      = require('cssnano');
const inline_svg   = require('postcss-inline-svg');
const gulpTsLint   = require('gulp-tslint');
const tslint       = require('tslint');

let ts_sources = ['src/**/*.ts', 'src/**/*.tsx'];

gulp.task('default', ['dev-server', "livereload-server", "background_webpack", "build_styl", "watch_styl", "watch_dist_js", "watch_html", "watch_tslint"]);
gulp.task('watch_dist_js', () => { gulp.watch(['dist/*.js'], livereload.reload); });
gulp.task('watch_html', () => { gulp.watch(['src/*.html'], livereload.reload); });
gulp.task('watch_styl', () => { gulp.watch(['src/**/*.styl', 'src/*.styl'], ['build_styl']); }); 
gulp.task('build_styl', build_styl);
gulp.task('min_styl', min_styl);
gulp.task('livereload-server', () => { livereload.listen(35701); });
gulp.task('background_webpack', background_webpack);
gulp.task('watch_tslint', () => { gulp.watch([ts_sources], ['tslint']); }); 
gulp.task('dev-server', dev_server);
gulp.task('tslint', lint);


let lint_debounce = null;
function lint(done) {
    if (lint_debounce) {
        done();
        return;
    }

    lint_debounce = setTimeout(()=>{
        lint_debounce = null;
        gulp.src(ts_sources, {base: '.'})
        .pipe(gulpTsLint({
            formatter: "prose"
        }))
        .pipe(gulpTsLint.report({
            emitError: false,
            reportLimit: 0,
            summarizeFailureOutput: false
        }))
    }, 50)
    done();
}

function build_styl(done) {
    pump([gulp.src('./src/ogs.styl'),
          sourcemaps.init(),
          stylus({
              compress: false,
          }),
          postcss([
              autoprefixer({
                  browsers: ["> 1%", "last 2 versions", "Firefox ESR"],
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
          }),
          postcss([
              autoprefixer({
                  browsers: ["> 1%", "last 2 versions", "Firefox ESR"],
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
    function launch() {
        console.log('Launching webpack')
        let env = process.env;
        let webpack = spawn('node', ['node_modules/webpack/bin/webpack.js', '--watch', '--progress', '--colors'])

        webpack.stdout.on('data', o=>process.stdout.write(o))
        webpack.stderr.on('data', o=>process.stderr.write(o))

        webpack.on('exit', ()=>{
            launch();
        })

    }
    launch();

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

    let beta_proxy = (prefix) => proxy('beta.online-go.com', {
        https: true,
        forwardPath: function(req, res) {
            let path = prefix + require('url').parse(req.url).path;
            console.log('-->', path);
            return path;
        }
    });

    devserver.use('/api', beta_proxy('/api'));
    devserver.use('/merchant', beta_proxy('/merchant'));
    devserver.use('/sso', beta_proxy('/sso'));
    devserver.use('/oauth2', beta_proxy('/oauth2'));
    devserver.use('/complete', beta_proxy('/complete'));
    devserver.use('/disconnect', beta_proxy('/disconnect'));

    devserver.get('*', (req, res) => {
        console.info(`GET ${req.path}`);

        let _index = fs.readFileSync('src/index.html', {encoding: 'utf-8'});

        let index = _index.replace(/[{][{]\s*(\w+)\s*[}][}]/g, (_,parameter) => {
            switch (parameter) {
                case 'CDN_SERVICE': return `//localhost:${port}/`;
                case 'LIVE_RELOAD': return `<script src="//${req.hostname}:35701/livereload.js"></script>`;
                case 'MIN': return '';

                case 'OG_TITLE': return '';
                case 'OG_URL': return '';
                case 'OG_IMAGE': return '';
                case 'OG_DESCRIPTION': return '';

                case 'RELEASE': return '';
                case 'VERSION': return '';
                case 'LANGUAGE_VERSION': return '';
                case 'VERSION_DOTJS': return 'js';
                case 'VERSION_DOTCSS': return 'css';
                case 'LANGUAGE_VERSION_DOTJS': return 'js';
                case 'EXTRA_CONFIG': 
                    return `<script>window['websocket_host'] = "https://beta.online-go.com";</script>`
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

}
