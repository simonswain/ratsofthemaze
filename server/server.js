'use strict';

var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var Hapi = require('hapi');
var Path = require('path');

var AssetManager = require('./assets');

module.exports = (config) => {
  config = config || {};

  if (!config.server) {
    config.server = {
      host: '127.0.0.1',
      port: 4002
    };
  }

  var root = __dirname + '/app';

  var server = new Hapi.Server();

  server.connection({
    host: config.server.host,
    port: config.server.port
  });

  var manifest = require(__dirname + '/manifest');
  var assets = AssetManager.load(manifest, config.services.assets);

  server.register(require('vision'), (err) => {
    if (err) {
      console.log('Failed to load vision.');
    }
    server.views({
      engines: {
        html: require('handlebars')
      },
      path: Path.join(__dirname, 'views'),
      isCached: (config.env !== 'development')
    });
  });

  server.register(require('inert'), (err) => {
    if (err) {
      console.log('Failed to load inert.');
    }
  });

  // server rendered views
  var handlers = {};
  var dir = __dirname + '/handlers';
  fs.readdirSync(dir).forEach((file) => {
    if (['.', '#'].indexOf(file.substr(0, 1)) > -1) {
      return;
    }
    var route = require(dir + '/' + file)(config, server, assets);
    handlers[file.substr(0, file.length - 3)] = route;
    server.route(route);
  });

  // static assets
  server.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: {
      file: Path.join(__dirname, 'images/favicon.ico')
    }
  });

  // rendered assets if not using CDN
  if (config.env === 'production') {
    server.route({
      method: 'GET',
      path: '/assets/{path*}',
      handler: {
        directory: {
          path: Path.join(__dirname, 'assets'),
          listing: false,
          index: false
        }
      }
    });
  }

  server.route({
    method: 'GET',
    path: '/images/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'images'),
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/fonts/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'fonts'),
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/sounds/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'sounds'),
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/app/js/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'app/js'),
        listing: false,
        index: false
      }
    }
  });

  server.register({
    register: require('hapi-less'),
    options: {
      home: __dirname + '/app/less',
      route: '/app/less/{filename*}',
      less: {
        compress: true
      }
    }
  }, (err) => {});

  server.register({
    register: require('hapi-less'),
    options: {
      home: __dirname + '/app/less',
      route: '/app/css/{filename*}',
      less: {
        compress: true
      }
    }
  }, (err) => {});

  // catchall route
  server.route({
    method: 'GET',
    path: '/{path*}',
    handler: handlers.index.handler
  });

  // server lifecycle manmagement
  var start = (done) => {
    async.series([
      (next) => {
        if (config.env === 'production') {
          return assets.useRendered(next);
        }
        next();
      },
      (next) => {
        server.start(next);
      }
    ], (err, res) => {
      if (done) {
        done();
      }
    });
  };

  var stop = (done) => {
    async.series([
      (next) => {
        server.stop({
          timeout: 1000
        }, (err, res) => {
          next();
        });
      },
    ], done);
  };

  return {
    assets: assets,
    start: start,
    stop: stop
  };
};
