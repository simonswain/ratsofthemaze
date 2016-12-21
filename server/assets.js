'use strict';

var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var UglifyJS = require('uglify-js');
var less = require('less');
var path = require('path');
var config = require('../config')(process.env.NODE_ENV);
var exec = require('child_process').exec;

var gitRev = function(done){
  exec(
    'git rev-parse --short HEAD',
    {cwd: __dirname},
    function (err, stdout, stderr) {
      done(stdout.split('\n').join(''));
    });
};

var create = function (opts, cdn) {

  var AWS = require('aws-sdk');

  AWS.config.update({
    accessKeyId: cdn.key,
    secretAccessKey: cdn.secret
  });

  opts = _.defaults(
    opts, {
      hash: null,
      key: false,
      base: '',
      url: '/',
      out: __dirname + '/assets',
      path: 'rats'
    });

  var assets = {
    css: [],
    js: []
  };

  var html = {
    css: '',
    js: ''
  };

  var urls = {
    css: '',
    js: ''
  };

  var renderedFiles;

  var deployAsset = function(source, key, mime, next){

    if (config.env !== 'production') {
      return next();
    }

    var s3obj = new AWS.S3({
      params: {
        Bucket: cdn.bucket,
        Key: key,
        ContentType : mime
      }});

    s3obj.upload({
      Body: fs.createReadStream(source)
    }).send(function(err, data) {
      if(err){
        console.log('error:', err);
      }
      next();
    });

  };

  var renderJs = function (done) {
    var files = _.map(assets.js, function (x) {
      return opts.base + '/' + x;
    });
    var filename = 'script-' + new Date().getTime() + '.js';
    if (opts.hash && opts.key) {
      filename = opts.key + '-' + opts.hash + '.js';
    } else if (opts.key){
      filename = opts.key + '-' + new Date().getTime() + '.js';
    }

    var outf = opts.out + '/' + filename;

    var minified = UglifyJS.minify(files);
    fs.writeFileSync(outf, minified.code);
    renderedFiles.js = cdn.host + '/' + opts.path + '/' + filename;
    console.log(renderedFiles.js);
    deployAsset(
      outf,
      opts.path + '/' + filename,
      'application/javascript',
      done
    );
  };

  var renderCss = function (done) {

    var filename = 'styles-' + new Date().getTime() + '.css';
    if (opts.hash && opts.key) {
      filename = opts.key + '-' + opts.hash + '.css';
    } else if (opts.key){
      filename = opts.key + '-' + new Date().getTime() + '.css';
    }

    var outf = opts.out + '/' + filename;
    var css = [];

    var renderOne = function (x, cb) {
      var src = opts.base + x;
      less.render(
        fs.readFileSync(src, 'utf8'), {
          compress: true,
          filename: path.resolve(src)
        },
        function (err, output) {
          if (err) {
            console.log(err);
          }
          css.push(output.css);
          cb();
        });
    };


    async.eachSeries(
      assets.css,
      renderOne,
      function (err, res) {
        var s = css.join('\n');
        fs.writeFileSync(outf, s);
        renderedFiles.css = cdn.host + '/' + opts.path + '/' + filename;
        console.log(renderedFiles.css);
        deployAsset(
          outf,
          opts.path + '/' + filename,
          'text/css',
          done
        );
      });

  };

  var renderIndex = function (done) {
    var src = opts.base + 'views/index.underscore.html';
    var tpl = _.template(fs.readFileSync(src, 'utf8'));
    var html = tpl({
      hash: opts.hash
    });
    renderedFiles.index = cdn.host + '/index.html';
    console.log(renderedFiles.index);
    var out = opts.out + '/index.html';
    fs.writeFileSync(out, html);
    deployAsset(
      out,
      'index.html',
      'text/html',
      done
    );
  };

  var useRendered = function (done) {
    gitRev((hash) => {
      opts.hash = hash;
      var base = cdn.host + '/' + opts.path + '/' + opts.key + '-' + opts.hash;
      renderedFiles = {};
      renderedFiles.js = base + '.js';
      renderedFiles.css = base + '.css';
      done(null);
    });
  };

  var render = function (done) {

    renderedFiles = {};

    var getHash = (next) => {
      gitRev((hash) => {
        opts.hash = hash;
        next();
      });
    };

    var checkdir = function (next) {
      var d = fs.existsSync(opts.out);
      if (!d) {
        fs.mkdirSync(opts.out);
      }
      return next();
    };

    var cleandir = function (next) {
      var files;
      var dirpath = opts.out;
      try {
        files = fs.readdirSync(dirpath);
      } catch (e) {
        return next();
      }

      if (files.length === 0) {
        return next();
      }

      for (var i = 0; i < files.length; i++) {
        if (opts.key && files[i].substr(0, opts.key.length) !== opts.key) {
          continue;
        }
        var filepath = dirpath + '/' + files[i];
        if (fs.statSync(filepath).isFile()) {
          fs.unlinkSync(filepath);
        }
      }
      next();
    };

    async.series([
      getHash,
      checkdir,
      cleandir,
      renderJs,
      renderCss,
      renderIndex
    ], function () {
      done(null, renderedFiles);
    });

  };

  var gen = function () {
    html.css = _.map(assets.css, function (x) {
      if (x.substr(-5) === '.less') {
        return '<link rel="stylesheet" href="' + opts.url + '' + x.slice(0, -5) + '.css' + '" />';
      }
      return '<link rel="stylesheet" href="' + opts.url + '' + x + '" />';
    }).join('\n');

    html.js = _.map(assets.js, function (x) {
      return '<script type="text/javascript" src="' + opts.url + '' + x + '"></script>';
    }).join('\n');

  };

  var add = function (f) {

    if (f.substr(0, 1) === '/') {
      f = f.substr(1);
    }

    var src = opts.base + '/' + f;

    if (fs.lstatSync(src).isDirectory()) {
      fs.readdirSync(src).forEach(function (file) {
        if (file.substr(0, 1) === '.') {
          return;
        }
        if (file.substr(0, 1) === '#') {
          return;
        }
        add(f + '/' + file);
      });
    }

    if (f.substr(-3) === '.js') {
      assets.js.push(f);
    }

    if (f.substr(-4) === '.css') {
      assets.css.push(f);
    }

    if (f.substr(-5) === '.less') {
      assets.css.push(f);
    }

    gen();

  };

  var js = function () {
    if (renderedFiles) {
      return '<script type="text/javascript" src="' + renderedFiles.js + '"></script>';
    }
    return html.js;
  };

  var css = function () {
    if (renderedFiles) {
      return '<link rel="stylesheet" href="' + renderedFiles.css + '" />';
    }
    return html.css;
  };

  return {
    add: add,
    css: css,
    js: js,
    render: render,
    useRendered: useRendered
  };
};

var load = function (manifests, opts) {

  var files = {};
  var keys = {};
  _.each(manifests, function (manifest, key) {
    keys[key] = {};
    keys[key] = create(manifest.opts, opts);
    _.each(manifest.assets, function (f) {
      keys[key].add(f);
    });
    keys[key].key = key;
  });

  var renderOne = function (key, next) {
    key.render(function (err, res) {
      files[key.key] = res;
      next();
    });
  };

  var render = function (target, done) {
    if (arguments.length === 1) {
      done = target;
      target = false;
    }

    async.eachSeries(
      _.toArray(keys),
      renderOne,
      function (err) {
        if (target) {
          fs.writeFileSync(
            target,
            JSON.stringify(files)
          );
        }
        done();
      });
  };

  var useRendered = function (target, done) {
    if (arguments.length === 1) {
      done = target;
      target = false;
    }
    async.eachSeries(
      _.toArray(keys),
      function(key, next){
        key.useRendered(next);
      }, done);
  };

  return {
    keys: keys,
    render: render,
    useRendered: useRendered
  };

};

module.exports = {
  load: load
};
