'use strict';

var fs = require('fs');
var _ = require('lodash');
var less = require('less');
var path = require('path');
var async = require('async');

module.exports = function renderLess (opts, done) {

  var outf = opts.out + '/index.html';
  
  var tpl = _.template(fs.readFileSync(opts.src + '/template.html'));
  var html = tpl({
    hash: opts.hash,
    ga: opts.ga
  });  
  fs.writeFileSync(outf, html)
  done();


};
