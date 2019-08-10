// Dependencies
const gulp = require("gulp");
const copy = require("gulp-copy");
const clean = require("gulp-clean");

const browserSync = require("browser-sync").create();

const sourceMaps = require("gulp-sourcemaps");

const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cssNano = require("gulp-cssNano");

const rollup = require("gulp-better-rollup");
const buble = require("rollup-plugin-buble");
const uglify = require("gulp-uglify");

// Project config
const config = {
  src: "./_src/",
  dev: "./dev/",
  dist: "./dist/",
  name: require("./package").name,
};

//  Log the file changed to console
function logChange(path) {
  console.log("File changed --> \x1b[32m\u001b[1m " + path + "\x1b[0m");
}

// Copy files
function copyHtml() {
  return gulp
    .src(config.src + "**/*.html")
    .pipe(copy(config.dev, { prefix: 1 }));
}

// SCSS processing
function style() {
  return gulp
    .src(config.src + "scss/style.scss")
    .pipe(sourceMaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer())
    .pipe(cssNano())
    .pipe(sourceMaps.write())
    .pipe(gulp.dest(config.dev + "css/"))
    .pipe(browserSync.stream());
}

// JS processing
function scripts() {
  return gulp
    .src(config.src + "js/index.js", {
      allowEmpty: true,
    })
    .pipe(sourceMaps.init())
    .pipe(
      rollup(
        {
          plugins: [
            buble({
              transforms: {
                modules: false,
              },
              targets: {
                firefox: 32,
                chrome: 24,
                safari: 6,
                opera: 15,
                edge: 10,
                ie: 10,
              },
            }),
          ],
        },
        [
          {
            format: "iife",
            file: "scripts.js",
            name: config.name,
          },
        ]
      )
    )
    .pipe(sourceMaps.write())
    .pipe(gulp.dest(config.dev + "js/"));
}

// JS packages output
function packageScripts() {
  return gulp
    .src(config.src + "js/index.js", {
      allowEmpty: true,
    })
    .pipe(
      rollup(
        {
          plugins: [
            buble({
              transforms: {
                modules: false,
              },
              targets: {
                firefox: 32,
                chrome: 24,
                safari: 6,
                opera: 15,
                edge: 10,
                ie: 10,
              },
            }),
          ],
        },
        [
          {
            format: "cjs",
            file: config.name + ".js",
            name: config.name,
          },
          {
            format: "es",
            file: config.name + ".esm.js",
            name: config.name,
          },
          {
            format: "umd",
            file: config.name + ".umd.js",
            name: config.name,
          },
          {
            format: "iife",
            file: config.name + ".iife.js",
            name: config.name,
          },
        ]
      )
    )
    .pipe(uglify())
    .pipe(gulp.dest(config.dist));
}

// Empty the dev folder
function cleanDev() {
  return gulp
    .src(config.dev + "/**/*", {
      read: false,
      allowEmpty: true,
    })
    .pipe(clean());
}
// empty the dist folder
function cleanDist() {
  return gulp
    .src(config.dist + "/**/*", {
      read: false,
      allowEmpty: true,
    })
    .pipe(clean());
}

// BrowserSync and watch tasks
function server() {
  browserSync.init({
    server: {
      baseDir: config.dev,
    },
  });

  // Watch scss, html and js files for changes. Process the files then update the browserSync server
  gulp.watch(config.src + "scss/**/*.scss", style);
  gulp
    .watch(config.src + "**/*.html")
    .on("change", gulp.series(copyHtml, browserSync.reload));
  gulp
    .watch(config.src + "**/*.js")
    .on("change", gulp.series(scripts, browserSync.reload));
}

// Gulp tasks exported
exports.dev = gulp.series(cleanDev, copyHtml, style, scripts, server);
exports.build = gulp.series(cleanDist, packageScripts);
