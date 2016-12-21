'use strict';

var fs = require('fs');
var _ = require('lodash');
var less = require('less');
var path = require('path');
var async = require('async');

module.exports = function renderLess (opts, done) {

  var outf = opts.out + '/css/styles-' + opts.hash + '.css';

  var src = opts.src + '/less';
  var css = [];


  var mkdir = function (next) {
    var dir = opts.out + '/css';
    var d = fs.existsSync(dir);
    if (!d) {
      fs.mkdirSync(dir);
    }
    next();
  };

  var cleanDir = function (next) {
    var files;
    var dir = opts.out + '/css';
    try {
      files = fs.readdirSync(dir);
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
      var file = dir + '/' + files[i];
      if (fs.statSync(file).isFile()) {
        fs.unlinkSync(file);
      }
    }
    
    next();
  };

  var renderOne = (x, cb) => {
    var f = src + '/' + x;
    less.render(
      fs.readFileSync(f, 'utf8'), {
        compress: true,
        filename: path.resolve(src)
      },
      (err, output) => {
        css.push(output.css);
        cb();
      });
  };

  var renderAll = (next) => {
    var files = _.filter(fs.readdirSync(src), (f) => {
      return !(f.substr(0, 1) === '.');
    });
    async.eachSeries(
      files,
      renderOne,
      (err, res) => {
        var s = css.join("\n");
        fs.writeFileSync(outf, s);
        next();
      });
  };

  async.series([
    mkdir,
    cleanDir,
    renderAll
  ], () => {
    done();
  });

};
