////////////////////////////////////////////////////////////////////////////////
// GULP PLUGINS
const gulp          = require('gulp'),
      csso          = require('gulp-csso'),
      sass          = require('gulp-sass'),
      clean         = require('gulp-clean'),
      babel         = require('gulp-babel'),
      concat        = require('gulp-concat'),
      cssmin        = require('gulp-cssmin'),
      rename        = require('gulp-rename'),
      uglify        = require('gulp-uglify'),
      prepack       = require('gulp-prepack'),
      htmlmin       = require('gulp-htmlmin'),
      plumber       = require('gulp-plumber'),
      sequence      = require('gulp-sequence'),
      removeLogs    = require('gulp-removelogs'),
      sourcemaps    = require('gulp-sourcemaps'),
      autoprefixer  = require('gulp-autoprefixer'),
      browserSync   = require('browser-sync').create();

////////////////////////////////////////////////////////////////////////////////
// GULP PATHS
const directorio = {
  raiz: './',
  view: {
    compile: {
      dir: './public/src/view/*.html'
    },
    build: {
      dir: './'
    },
    delete: {
      dir: './*.html'
    }
  },
  style: {
    compile: {
      dir: './public/src/scss/*.*',
      plugins: './public/src/scss/plugins/*.*',
    },
    build: {
      dir: './public/css/'
    },
    delete: {
      dir: './public/css/*.*',
    }
  },
  javascript: {
    compile: {
      dir: './public/src/babel/*.*',
      plugins: './public/src/babel/plugins/*.*',
    },
    build: {
      dir: './public/js/'
    },
    delete: {
      dir: './public/js/*.*',
    }
  },
  font: {
    dir: './public/fonts'
  },
};

////////////////////////////////////////////////////////////////////////////////
// INICIAR SERVIDOR
gulp.task('server', () => browserSync.init({
  server: { baseDir: directorio.raiz },
  logPrefix: 'modernizacion',
  host: 'localhost',
  tunnel: 'modernizacion',
  port: 9000,
  online: true,
  browser: ['google chrome'],
  logLevel: 'info',
  ui: false,
}));

////////////////////////////////////////////////////////////////////////////////
// BORRAR ARCHIVOS COMPILADOS
gulp.task('delete_compiled_files', () => gulp.src([
  directorio.view.delete.dir,
  directorio.style.delete.dir,
  directorio.javascript.delete.dir
]).pipe(clean({ force: true })));

////////////////////////////////////////////////////////////////////////////////
// CLONAR ARCHIVOS DE NODE_MODULES
gulp.task('node_javascript_import', () => gulp.src([
  './node_modules/jquery/dist/jquery.min.js',
  './node_modules/bootstrap/dist/js/bootstrap.min.js',
  './node_modules/d3/build/d3.min.js',
  './node_modules/d3-drag/build/d3-drag.min.js'
]).pipe(uglify()).pipe(gulp.dest(directorio.javascript.build.dir)));
gulp.task('node_styles_import', () => gulp.src([
  './node_modules/bootstrap/dist/css/bootstrap.min.css',
  './node_modules/argob-poncho/dist/css/poncho.min.css',
  './node_modules/argob-poncho/dist/css/roboto-fontface.css'
  ]).pipe(cssmin()).pipe(gulp.dest(directorio.style.build.dir)));
gulp.task('node_fonts_import', () => gulp.src([
  './node_modules/bootstrap/dist/fonts/*.*',
  './node_modules/argob-poncho/dist/fonts/*.*'
]).pipe(gulp.dest(directorio.font.dir)));
gulp.task('plugins_javascript_import', () => gulp.src([
  directorio.javascript.compile.plugins
]).pipe(gulp.dest(directorio.javascript.build.dir)));
gulp.task('node_all_files_import', sequence([
  'node_javascript_import',
  'node_styles_import',
  'node_fonts_import',
  'plugins_javascript_import'
]));

////////////////////////////////////////////////////////////////////////////////
// COMPILAR HTML
gulp.task('compile_views', () => gulp.src(directorio.view.compile.dir)
  .pipe(plumber())
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest(directorio.raiz))
  .pipe(browserSync.stream()));

////////////////////////////////////////////////////////////////////////////////
// COMPILAR SASS
gulp.task('compile_sass', () => gulp.src([directorio.style.compile.dir, directorio.style.compile.plugins])
  .pipe(plumber())
  .pipe(sass())
  .pipe(csso({ restructure: true, sourceMap: false, debug: false }))
  .pipe(autoprefixer({ browsers: ['last 30 versions', '> 1%', 'ie 9'], cascade: false }))
  .pipe(cssmin())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(directorio.style.build.dir))
  .pipe(browserSync.stream()));

////////////////////////////////////////////////////////////////////////////////
// COMPILAR ECMAS 6
gulp.task('compile_babel:dev', () => gulp.src(directorio.javascript.compile.dir)
  .pipe(plumber())
  .pipe(babel({ presets: ['es2015', 'es2016', 'es2017'] }))
  // .pipe(prepack())
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(directorio.javascript.build.dir))
  .pipe(browserSync.stream()));
gulp.task('compile_babel:prod', () => gulp.src(directorio.javascript.compile.dir)
  .pipe(plumber())
  .pipe(babel({ presets: ['es2015', 'es2016', 'es2017'] }))
  .pipe(removeLogs())
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(directorio.javascript.build.dir))
  .pipe(browserSync.stream()));

////////////////////////////////////////////////////////////////////////////////
// OPTIMIZACIÓN

////////////////////////////////////////////////////////////////////////////////
// EJECUTAR WATCH
gulp.task('watch_babel', () => gulp.watch(directorio.javascript.compile.dir, ['compile_babel:dev']));
gulp.task('watch_scss', () => gulp.watch([directorio.style.compile.dir, directorio.style.compile.plugins], ['compile_sass']));
gulp.task('watch_html', () => gulp.watch(directorio.view.compile.dir, ['compile_views']));
gulp.task('all_watch', sequence(['watch_babel', 'watch_scss', 'watch_html']));

////////////////////////////////////////////////////////////////////////////////
// COMPILAR
gulp.task('dev', sequence(
  'node_all_files_import',
  'compile_views',
  'compile_sass',
  'compile_babel:dev',
  'all_watch',
  'server'
));
gulp.task('build', sequence(
  'delete_compiled_files',
  'node_all_files_import',
  'compile_views',
  'compile_sass',
  'compile_babel:prod',
  'server'
));
