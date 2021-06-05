const fs = require('fs-extra')
const glob = require('glob')
const logger = require('gulplog')
const file = require('gulp-file')
const gulp = require('gulp')
const browserify = require('browserify')
const watchify = require('watchify')
const tinyify = require('tinyify')
const source = require('vinyl-source-stream')
const del = require('del')

function buildStepGenerator(opts = {versions: [], options: []}) {
    const steps = []

    for (const version of opts.versions) {
        const buildDirName = getBuildDirectoryName(version)
        const watch = opts.options.includes('watch')

        steps.push(gulp.parallel(
            manifestGenerator({version: version, watch: watch, dest: `./build/${buildDirName}`}),
            copyFileGenerator({src: './public', dest: `./build/${buildDirName}/public`, watch: watch}),
            bundleGenerator({
                pattern: 'src/background/**.js',
                dest: `build/${buildDirName}/background.js`,
                watch: watch
            }),
            bundleGenerator({
                pattern: 'src/content/**.js',
                dest: `build/${buildDirName}/content/content.js`,
                watch: watch
            }),
            copyFileGenerator({
                src: './src/action/popup.html',
                dest: `build/${buildDirName}/action/popup.html`,
                watch: watch
            }),
            bundleGenerator({
                pattern: 'src/action/**.js',
                dest: `build/${buildDirName}/action/popup.js`,
                watch: watch
            })))
    }

    return gulp.series(
        cleanBuildDir,
        ...steps
    )
}

function copyFileGenerator(opts) {
    return function copyFile() {

        async function _copyFile() {
            fs.copySync(opts.src, opts.dest) //TODO ensure when files are deleted these changes are synced
        }

        if (opts.watch) {
            const watcher = gulp.watch(opts.src, _copyFile)
            watcher.on('unlink', () => {
                del(opts.dest)
            })
        }

        return _copyFile()
    }
}

function manifestGenerator(opts = {version: 'v2', watch: false}) {

    return function manifest() {
        function _manifest() {
            let manifest = JSON.parse(fs.readFileSync(`./${opts.version}.manifest.json`, 'utf-8'))
            const styleSheets = listAllFiles('public/styles/**.css')
            manifest.content_scripts[0].css = [...styleSheets]

            return file('manifest.json', toJson(manifest), {src: true}).pipe(gulp.dest(opts.dest))
        }

        if (opts.watch) {
            gulp.watch(`./${opts.version}.manifest.json`, _manifest)
        }

        return _manifest()
    }
}

function bundleGenerator(opts = {debug: false, watch: false}) {
    if (!opts.pattern || !opts.dest) throw Error(`Missing pattern or destination`)

    return function bundle() {

        logger.info(`Bundling js using options ${toJson(opts)}`)

        const plugins = opts.watch ? [tinyify, watchify] : [tinyify]

        const b = browserify(
            listAllFiles(opts.pattern),
            {plugin: plugins, debug: opts.debug, packageCache: {}, cache: {}}
        )

        function _bundle() {
            return b.bundle()
                .on('error', logger.error.bind(logger, "Failed while generating bundle"))
                .pipe(source(opts.dest))
                .pipe(gulp.dest('.'))
        }

        function _watch() {
            b.on('update', _bundle)
            b.on('log', logger.info)
        }

        if (opts.watch) {
            _watch()
        }

        return _bundle()
    }
}

function getBuildDirectoryName(manifestVersion) {
    let manifest = JSON.parse(fs.readFileSync(`./${manifestVersion}.manifest.json`, 'utf-8'))
    let pkg = JSON.parse(fs.readFileSync(`./package.json`, 'utf-8'))

    const name = pkg.name
    const version = manifest.version

    return `${name}-${version}-${manifestVersion}`
}

function cleanBuildDir() {
    return fs.emptyDir('./build')
}

function listAllFiles(pattern, filter = file => true) {
    let files = glob.sync(pattern)
    files = files.filter(file => filter(file))
    logger.info(`Found ${files.length} files\n${files.join('\n')}\n`)
    return files
}

function toJson(object) {
    return JSON.stringify(object, null, 2)
}

exports.clean = cleanBuildDir
exports.build = buildStepGenerator({ versions: ['v2','v3'], options: ['watch'] })
exports.buildOnce = buildStepGenerator({ versions: ['v2','v3'], options: [] })