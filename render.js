var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var path = require('path');

var renderLess = require('./lib/renderLess')
var renderHtml = require('./lib/renderHtml')
var renderJs = require('./lib/renderJs')

var config  = require(__dirname + '/config')();

var opts = {
  ga: config.services.ga.id,
  hash: Date.now(),
  src: __dirname + '/src',
  out: __dirname + '/htdocs'
};

async.applyEach([
  renderHtml,
  renderLess,
  renderJs
], opts, (err) => {
  console.log('Done');
});
