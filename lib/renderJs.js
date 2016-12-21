'use strict';

var fs = require('fs');
var _ = require('lodash');
var less = require('less');
var path = require('path');
var async = require('async');

module.exports = function renderLess (opts, done) {

  var outf = opts.out + '/js/script-' + opts.hash + '.js';

  var src = opts.src + '/js';
  var js = [];


  var mkdir = function (next) {
    var dir = opts.out + '/js';
    var d = fs.existsSync(dir);
    if (!d) {
      fs.mkdirSync(dir);
    }
    next();
  };

  var cleanDir = function (next) {
    var files;
    var dir = opts.out + '/js';
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
    let output = fs.readFileSync(f, 'utf8')
    js.push(output);
    cb();
  };

  var renderAll = (next) => {
    var files = _.filter(fs.readdirSync(src), (f) => {
      return !(f.substr(0, 1) === '.');
    });
    async.eachSeries(
      files,
      renderOne,
      (err, res) => {
        var s = js.join("\n");
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
